package main

import "github.com/leancloud/go-sdk/leancloud"

//
type Base struct {
	leancloud.Object
	BaseType BaseType `json:"base_type"`
	BelongID string   `json:"belong_id"`
	Version  uint64   `json:"version"`
}

//
func (*Base) TableName() string {
	return "meta_base"
}
