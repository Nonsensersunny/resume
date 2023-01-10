package main

//
type BaseType int

const (
	BaseTypeBasic BaseType = iota
	BaseTypeContact
	BaseTypeWorkExperiences
	BaseTypePersonalProjects
	BaseTypeSkills
)

//
type I18nEnum string

const (
	I18nEnumEn I18nEnum = "en"
)

//
type ValueType int

const (
	ValueTypeString ValueType = iota
	ValueTypeNumber
	ValueTypeObject
	ValueTypeBoolean
)
