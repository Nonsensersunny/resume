package main

import "github.com/leancloud/go-sdk/leancloud"

//
type User struct {
	leancloud.Object
	UserID    string `json:"user_id"`
	ViewCnt   uint64 `json:"view_cnt"`
	UpdateCnt uint64 `json:"update_cnt"`
}

//
func (*User) TableName() string {
	return "user"
}
