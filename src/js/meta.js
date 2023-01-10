//
class Error {
    code
    message
    message_en

    constructor(code, message, message_en) {
        this.code = code;
        this.message = message;
        this.message_en = message_en;
    }

    error(locale="zh") {
        switch(locale) {
            case "zh":
                return this.message;
            case "en":
                return this.message_en;
            default:
                return "unknown error";
        }
    }
}

const ErrUserNotFound = new Error(0, "未查询到用户信息", "User Not Found.");
const ErrBaseInfoNotFound = new Error(1, "未查询到相关信息", "Related Information Not Found.")
const ErrInvalidQueryCond = new Error(2, "无效查询条件", "Invalid Query Condition.");
const ErrUnsupportedValueType = new Error(3, "不支持的值类型", "Unsupported Value Type.");

/*======================================================================================*/

//
const BaseTypeBasicInfo = 0;
const BaseTypeContactInfo = 1;
const BaseTypeWorkExperience = 2;
const BaseTypeProject = 3;
const BaseTypeSkill = 4;

//
const ValueTypeString = 0;
const ValueTypeNumber = 1;
const ValueTypeArray = 2;

function parseValue(val, valType) {
    switch (valType) {
        case ValueTypeString:
            return val;
        case ValueTypeNumber:
            return Number(val);
        case ValueTypeArray:
            return JSON.parse(val);
        default:
            return val;
    }
}

/*======================================================================================*/
//
class I18nValue {
    default_val
    i18n_val

    constructor(default_val, i18n_val) {
        this.default_val = default_val;
        this.i18n_val = i18n_val;
    }
}

//
class Meta {
    id
    base_id
    key
    value
    value_i18n
    value_type
    min_version
    max_version

    table_name() {
        return "meta";
    }

    constructor(base_id) {
        this.base_id = base_id;
    }

    load() {
        return Jorm.find_by_id(this, "base_id");
    }

    parse() {
        return new I18nValue(parseValue(this.value, this.value_type), this.value_i18n);
    }

    load_map() {
        return this.load().then((res) => {
            return new Map(res.map((obj) => [obj.key, obj]));
        });
    }

    load_and_assign(obj) {
        return this.load_map().then((res) => {
            for (let k of Object.keys(obj)) {
                if (res.has(k)) {
                    obj[k] = res.get(k).parse();
                }
            }
            return obj;
        });
    }
}

//
class MetaBase {
    id
    belong_id
    base_type
    version

    table_name() {
        return "meta_base";
    }

    constructor(belong_id, base_type=0) {
        this.belong_id = belong_id;
        this.base_type = base_type;
    }

    load() {
        return Jorm.find_with_and_cond(this, [
            new QueryCondition(this.table_name(), "belong_id", this.belong_id),
            new QueryCondition(this.table_name(), "base_type", this.base_type)
        ]).then((res) => {
            if (res.length === 0) {
                return ErrBaseInfoNotFound;
            }
            return res;
        })
    }
}



class QueryCondition {
    key
    val
    table_name
    op

    constructor(table_name, key, val, op="equalTo") {
        this.table_name = table_name;
        this.key = key;
        this.val = val;
        this.op = op;
    }

    apply() {
        let query = new AV.Query(this.table_name);
        query[this.op](this.key, this.val);
        return query;
    }

    and(another_cond) {
        return AV.Query.and(this.apply(), another_cond.apply());
    }

    or(another_cond) {
        return AV.Query.and(this.apply(), another_cond.apply());
    }
}

//
class Jorm {
    static find_by_id(obj, id_alias="id") {
        let query = new AV.Query(obj.table_name());
        query.equalTo(id_alias, obj[id_alias]);
        return query.find().then((result) => {
            return this.assign_item_to_obj(obj, result);
        })
    }

    static find_with_and_cond(obj, conditions) {
        if (conditions.length === 0) {
            return Promise.reject(ErrInvalidQueryCond);
        } else if (conditions.length === 1) {
            return conditions[0].apply().find().then((res) => {
                return this.assign_item_to_obj(obj, res)
            })
        } else {
            let startQuery = conditions[0];
            for (let i = 1; i < conditions.length; i++) {
                startQuery = startQuery.and(conditions[i]);
            }
            return startQuery.find().then((res) => {
                return this.assign_item_to_obj(obj, res);
            })
        }
    }

    static assign_item_to_obj(obj, items) {
        let res = [];
        items.forEach((item, idx) => {
            let tmp = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
            for (let k of Object.keys(obj)) {
                tmp[k] = item.get(k);
            }

            tmp.id = item.id;
            tmp.created_at = item.createdAt;
            tmp.updated_at = item.updatedAt;

            res.push(tmp);
        });
            
        return res;
    }
}

/*======================================================================================*/

//
class FakeUser {
    id 
    user_id
    view_cnt
    update_cnt
    created_at
    updated_at

    table_name() {
        return "user";
    }

    login(pwd="") {
        
    }

    constructor(user_id) {
        this.user_id = user_id;
    }

    load() {
        return Jorm.find_by_id(this, "user_id").then((result) => {
            if (result.length === 1) {
                return result[0];
            } else {
                throw ErrUserNotFound;
            }
        });
    }

    fetch_info(info_type) {
        return this.load().then((res) => {
            return new MetaBase(res.id, info_type).load().then((bres) => {
                return new Meta(bres.id).load();
            });
        });
    }

    fetch_and_assign(info_type, obj) {
        return new MetaBase(this.id, info_type).load().then((bres) => {
            return Promise.all(bres.map(item => {
                console.log(item)
                return new Meta(item.id).load_and_assign(obj);
            }));
            // bres.forEach((item, idx) => {

            // })
            // return new Meta(bres.id).load_and_assign(obj);
        });
    }
}

//
class BizContact {
    tel
    mail
    wechat
    qq
}

//
class BizBasic {
    avatar
    motto
    name
    gender
    edu_background
    undergraduate
    postgraduate
    working_year
    blog
    github
    intro
    expect
    pdf_resume
}

//
class BizExperience {
    name
    logo
    date
    projects

    load_projects() {
        let projects = [];
        let projectPromises = [];
        this.projects.forEach((item, idx) => {
            projectPromises.push(new MetaBase(item, BaseTypeProject).load().then((mres) => {
                projects.push(new Meta(mres.id).load_and_assign(new BizProject()))
            }));
        });
        return Promise.all(projectPromises).then((res) => {
            this.projects = projects;
            return this;
        })
    }
}

//
class BizProject {
    name
    intro
    techs
    thumb
    fame
    source
    address
    github
}

class BizSkill {
    category
    contents
}

//
class ResumeTemplate {
    user 
    contact 
    basic 
    experiences 
    projects 
    skills 

    load(user_id) {
        return new FakeUser(user_id).load().then((ures) => {
            this.user = ures;
            let contact = ures.fetch_and_assign(BaseTypeContactInfo, new BizContact());
            let basic = ures.fetch_and_assign(BaseTypeBasicInfo, new BizBasic());
            let experiences = ures.fetch_and_assign(BaseTypeWorkExperience, new BizExperience());
            let projects = ures.fetch_and_assign(BaseTypeProject, new BizProject());
            let skills = ures.fetch_and_assign(BaseTypeSkill, new BizSkill());
            return Promise.all([contact, basic, experiences, projects, skills]).then((pres) => {
                console.log(pres)
                this.contact = pres[0];
                this.basic = pres[1];
                this.experiences = pres[2];
                this.projects = pres[3];
                this.skills = pres[4];

                return this;
            })
        })
    }
}



new ResumeTemplate().load("test").then((res) => {
    console.log(res)
})
