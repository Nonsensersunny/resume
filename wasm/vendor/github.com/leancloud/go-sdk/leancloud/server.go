package leancloud

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"runtime/debug"
	"strings"
	"time"
)

const cloudFunctionTimeout = time.Second * 15

type metadataResponse struct {
	Result []string `json:"result"`
}

type functionResponse struct {
	Result interface{} `json:"result"`
}

// Handler takes all requests related to LeanEngine
func (engine *engine) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		uri := strings.Split(r.RequestURI, "/")
		engine.corsHandler(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if strings.HasPrefix(r.RequestURI, "/1.1/functions/") || strings.HasPrefix(r.RequestURI, "/1/functions/") {
			if strings.Compare(r.RequestURI, "/1.1/functions/_ops/metadatas") == 0 || strings.Compare(r.RequestURI, "/1/functions/_ops/metadatas") == 0 {
				engine.metadataHandler(w, r)
			} else {
				if uri[3] != "" {
					if len(uri) == 5 {
						engine.classHookHandler(w, r, uri[3], uri[4])
					} else {
						engine.functionHandler(w, r, uri[3], false)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}
		} else if strings.HasPrefix(r.RequestURI, "/1.1/call/") || strings.HasPrefix(r.RequestURI, "/1/call/") {
			if engine.functions[uri[3]] != nil {
				engine.functionHandler(w, r, uri[3], true)
			} else {
				w.WriteHeader(http.StatusNotFound)
			}
		} else if r.RequestURI == "/__engine/1/ping" || r.RequestURI == "/__engine/1.1/ping" {
			engine.healthCheckHandler(w, r)
		}
	})
}

func (engine *engine) corsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("origin") != "" {
		w.Header().Add("Access-Control-Allow-Origin", r.Header.Get("origin"))
	}

	if r.Method == "OPTIONS" {
		w.Header().Add("Access-Control-Max-Age", "86400")
		w.Header().Add("Access-Control-Allow-Methods", "HEAD, GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Add("Access-Control-Allow-Headers", `Content-Type,X-AVOSCloud-Application-Id,X-AVOSCloud-Application-Key,X-AVOSCloud-Application-Production,X-AVOSCloud-Client-Version,X-AVOSCloud-Request-Sign,X-AVOSCloud-Session-Token,X-AVOSCloud-Super-Key,X-LC-Hook-Key,X-LC-Id,X-LC-Key,X-LC-Prod,X-LC-Session,X-LC-Sign,X-LC-UA,X-Requested-With,X-Uluru-Application-Id,X-Uluru-Application-Key,X-Uluru-Application-Production,X-Uluru-Client-Version,X-Uluru-Session-Token`)
	}
}

func (engine *engine) metadataHandler(w http.ResponseWriter, r *http.Request) {
	if !engine.validateMasterKey(r) {
		writeCloudError(w, r, CloudError{
			Code:       http.StatusUnauthorized,
			Message:    fmt.Sprintf("Master Key check failed, request from %s", r.RemoteAddr),
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	meta, err := engine.generateMetadata()
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	w.Write(meta)
}

func (engine *engine) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := json.Marshal(map[string]string{
		"runtime": runtime.Version(),
		"version": Version,
	})
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	w.Write(resp)
}

func (engine *engine) functionHandler(w http.ResponseWriter, r *http.Request, name string, rpc bool) {
	if engine.functions[name] == nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    fmt.Sprintf("No such cloud function %s", name),
			StatusCode: http.StatusNotFound,
		})
		return
	}

	if engine.functions[name].defineOption["hook"] == true {
		if !engine.validateHookKey(r) {
			writeCloudError(w, r, CloudError{
				Code:       http.StatusUnauthorized,
				Message:    fmt.Sprintf("Hook key check failed, request from %s", r.RemoteAddr),
				StatusCode: http.StatusUnauthorized,
			})
			return
		}
	}

	if engine.functions[name].defineOption["internal"] == true {
		if !engine.validateMasterKey(r) {
			if !engine.validateHookKey(r) {
				master, pass := engine.validateSignature(r)
				if !master || !pass {
					writeCloudError(w, r, CloudError{
						Code:       http.StatusUnauthorized,
						Message:    fmt.Sprintf("Internal cloud function, request from %s", r.RemoteAddr),
						StatusCode: http.StatusUnauthorized,
					})
					return
				}
			}
		}
	}

	if !engine.validateAppKey(r) {
		if !engine.validateMasterKey(r) {
			_, pass := engine.validateSignature(r)
			if !pass {
				writeCloudError(w, r, CloudError{
					Code:       http.StatusUnauthorized,
					Message:    fmt.Sprintf("App key check failed, request from %s", r.RemoteAddr),
					StatusCode: http.StatusUnauthorized,
				})
				return
			}
		}
	}

	request, err := engine.constructRequest(r, name, rpc)
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	ret, err := engine.executeTimeout(request, name, cloudFunctionTimeout)
	if err != nil {
		writeCloudError(w, r, err)
		return
	}
	var resp functionResponse
	if rpc {
		resp.Result = encode(ret, true)
	} else {
		resp.Result = ret
	}

	respJSON, err := json.Marshal(resp)
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	w.Write(respJSON)
}

func (engine *engine) classHookHandler(w http.ResponseWriter, r *http.Request, class, hook string) {
	if !engine.validateHookKey(r) {
		writeCloudError(w, r, CloudError{
			Code:       http.StatusUnauthorized,
			Message:    fmt.Sprintf("Hook key check failed, request from %s", r.RemoteAddr),
			StatusCode: http.StatusUnauthorized,
		})
		return
	}

	name := fmt.Sprint(classHookmap[hook], class)

	request, err := engine.constructRequest(r, name, false)
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	ret, err := engine.executeTimeout(request, name, cloudFunctionTimeout)

	if err != nil {
		writeCloudError(w, r, err)
		return
	}

	var resp map[string]interface{}
	if hook == "beforeSave" {
		resp = encodeObject(ret, false, false)
	} else {
		resp = map[string]interface{}{
			"result": "ok",
		}
	}

	respJSON, err := json.Marshal(resp)
	if err != nil {
		writeCloudError(w, r, CloudError{
			Code:       1,
			Message:    err.Error(),
			StatusCode: http.StatusInternalServerError,
			callStack:  debug.Stack(),
		})
		return
	}

	w.Write(respJSON)
}

func (engine *engine) executeTimeout(r *FunctionRequest, name string, timeout time.Duration) (interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	var ret interface{}
	var err error
	ch := make(chan bool, 0)
	go func() {
		defer func() {
			if ierr := recover(); ierr != nil {
				err = CloudError{
					Code:       1,
					Message:    fmt.Sprint(ierr),
					StatusCode: http.StatusInternalServerError,
					callStack:  debug.Stack(),
				}
				ch <- true
			}
		}()
		ret, err = engine.functions[name].call(r)
		ch <- true
	}()

	select {
	case <-ch:
		return ret, err
	case <-ctx.Done():
		return nil, CloudError{
			Code:       124,
			Message:    fmt.Sprintf("LeanEngine: /1.1/functions/%s : function timeout (15000ms)", name),
			StatusCode: http.StatusServiceUnavailable,
		}
	}
}

func (engine *engine) unmarshalBody(r *http.Request) (interface{}, error) {
	body := make(map[string]interface{})
	err := json.NewDecoder(r.Body).Decode(&body)

	if err == io.EOF {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	defer r.Body.Close()

	return body, nil
}

func (engine *engine) constructRequest(r *http.Request, name string, rpc bool) (*FunctionRequest, error) {
	request := new(FunctionRequest)
	request.Meta = map[string]string{
		"remoteAddr": r.RemoteAddr,
	}
	var sessionToken string
	if r.Header.Get("X-LC-Session") != "" {
		sessionToken = r.Header.Get("X-LC-Session")
	} else if r.Header.Get("x-uluru-session-token") != "" {
		sessionToken = r.Header.Get("x-uluru-session-token")
	} else if r.Header.Get("x-avoscloud-session-token") != "" {
		sessionToken = r.Header.Get("x-avoscloud-session-token")
	}

	if engine.functions[name].defineOption["fetchUser"] == true && sessionToken != "" {
		user, err := Engine.client().Users.Become(sessionToken)
		if err != nil {
			return nil, err
		}
		request.CurrentUser = user
		request.SessionToken = sessionToken
	}

	if r.Body == nil {
		request.Params = nil
		return request, nil
	}

	params, err := engine.unmarshalBody(r)
	if err != nil {
		return nil, err
	}

	if rpc {
		decodedParams, err := decode(params)
		if err != nil {
			return nil, err
		}

		request.Params = decodedParams
	} else {
		request.Params = params
	}

	return request, nil
}

func (engine *engine) generateMetadata() ([]byte, error) {
	meta := metadataResponse{
		Result: []string{},
	}

	for k := range engine.functions {
		meta.Result = append(meta.Result, k)
	}
	return json.Marshal(meta)
}

func (engine *engine) validateAppID(r *http.Request) bool {
	if r.Header.Get("X-LC-Id") != "" {
		if engine.client().appID != r.Header.Get("X-LC-Id") {
			return false
		}
	} else if r.Header.Get("x-avoscloud-application-id") != "" {
		if engine.client().appID != r.Header.Get("x-avoscloud-application-id") {
			return false
		}
	} else if r.Header.Get("x-uluru-application-id") != "" {
		if engine.client().appID != r.Header.Get("x-uluru-application-id") {
			return false
		}
	} else {
		return false
	}

	return true
}

func (engine *engine) validateAppKey(r *http.Request) bool {
	if !engine.validateAppID(r) {
		return false
	}

	if r.Header.Get("X-LC-Key") != "" {
		if engine.client().appKey != r.Header.Get("X-LC-Key") {
			return false
		}
	} else if r.Header.Get("x-avoscloud-application-key") != "" {
		if engine.client().appKey != r.Header.Get("x-avoscloud-application-key") {
			return false
		}
	} else if r.Header.Get("x-uluru-application-key") != "" {
		if engine.client().appKey != r.Header.Get("x-uluru-application-key") {
			return false
		}
	} else {
		return false
	}

	return true
}

func (engine *engine) validateMasterKey(r *http.Request) bool {
	if !engine.validateAppID(r) {
		return false
	}

	if r.Header.Get("X-LC-Key") != "" {
		if strings.TrimSuffix(r.Header.Get("X-LC-Key"), ",master") != engine.client().masterKey {
			return false
		}
	} else if r.Header.Get("x-avoscloud-master-key") != "" {
		if r.Header.Get("x-avoscloud-master-key") != engine.client().masterKey {
			return false
		}
	} else if r.Header.Get("x-uluru-master-key") != "" {
		if r.Header.Get("x-uluru-master-key") != engine.client().masterKey {
			return false
		}
	} else {
		return false
	}

	return true
}

func (engine *engine) validateHookKey(r *http.Request) bool {
	if !engine.validateAppID(r) {
		return false
	}

	if os.Getenv("LEANCLOUD_APP_HOOK_KEY") != r.Header.Get("X-LC-Hook-Key") {
		return false
	}

	return true
}

func (engine *engine) validateSignature(r *http.Request) (bool, bool) {
	var master, pass bool
	if !engine.validateAppID(r) {
		return master, pass
	}

	var sign string
	if r.Header.Get("X-LC-Sign") != "" {
		sign = r.Header.Get("X-LC-Sign")
	} else if r.Header.Get("x-avoscloud-request-sign") != "" {
		sign = r.Header.Get("x-avoscloud-request-sign")
	}

	if sign == "" {
		return master, pass
	}
	signSlice := strings.Split(sign, ",")
	var hash [16]byte
	if len(signSlice) == 3 && signSlice[2] == "master" {
		hash = md5.Sum([]byte(fmt.Sprint(signSlice[1], engine.client().masterKey)))
		master = true
	} else {
		hash = md5.Sum([]byte(fmt.Sprint(signSlice[1], engine.client().appKey)))
	}
	if signSlice[0] == fmt.Sprintf("%x", hash) {
		pass = true
	}
	return master, pass
}
