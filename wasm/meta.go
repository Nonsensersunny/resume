package main

import "github.com/leancloud/go-sdk/leancloud"

//
type Meta struct {
	leancloud.Object
	BaseID     string    `json:"base_id"`
	Key        string    `json:"key"`
	Value      string    `json:"value"`
	MaxVersion uint64    `json:"max_version"`
	MinVersion uint64    `json:"min_version"`
	ValueI18n  I18nValue `json:"value_i_18_n"`
	ValueType  ValueType `json:"value_type"`
}

func (*Meta) TableName() string {
	return "meta"
}
