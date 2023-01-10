package main

import (
	"github.com/leancloud/go-sdk/leancloud"
)

var (
	client *leancloud.Client
)

func init() {
	client = leancloud.NewClient(&leancloud.ClientOptions{
		AppID:     "lqrMXLS0fek11hCZhv8suKq5-gzGzoHsz",
		AppKey:    "1w38CApjvkOToSWCDz6nrtnb",
		MasterKey: "nAFzm1DhrmvattcKgAhpVNUv",
		ServerURL: "https://lqrmxls0.lc-cn-n1-shared.com",
	})
}

// This calls a JS function from Go.
func main() {

}

// This function is imported from JavaScript, as it doesn't define a body.
// You should define a function named 'add' in the WebAssembly 'env'
// module from JavaScript.
//
//export add
//func add(x, y int) int

// This function is exported to JavaScript, so can be called using
// exports.multiply() in JavaScript.
//
//export multiply
func multiply(x, y int) int {
	return x * y
}

// export load_user

func LoadUser(userID string) *User {
	output := new(User)
	if err := client.Class("user").NewQuery().EqualTo("user_id", userID).First(&output); err != nil {
		return nil
	} else {
		return output
	}
}
