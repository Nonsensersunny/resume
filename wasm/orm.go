package main

import "github.com/leancloud/go-sdk/leancloud"

//
type Orm struct {
	class *leancloud.Class
}

func NewOrm(tabler Tabler) *Orm {
	return &Orm{
		class: client.Class(tabler.TableName()),
	}
}

//
func (o *Orm) FindByID(id string, output any) error {
	return o.class.ID(id).Get(output)
}

//
func (o *Orm) FindByEqAnd(cond map[string]any, output any) error {
	var parsedConds []*leancloud.Query
	for k, v := range cond {
		parsedConds = append(parsedConds, o.class.NewQuery().EqualTo(k, v))
	}

	return o.class.NewQuery().And(parsedConds...).Find(output)
}
