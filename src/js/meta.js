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

    static table_name() {
        return "meta";
    }
}

//
class MetaBase {
    id
    belong_id
    base_type
    version

    static table_name() {
        return "meta_base";
    }
}

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

    from(user_id) {
        let user = Jorm.find_by_id(this, user_id, "user_id");
        user.then((result) => {
            console.log(this);
        });
    }
}

//
class Jorm {
    static find_by_id(obj, id, id_alias="id") {
        console.log(obj, id, id_alias);
        let query = new AV.Query(obj.table_name());
        query.equalTo(id_alias, id);
        return query.find().then((result) => {
            result.forEach((item, idx) => {
                
            });
            console.log(result);
            obj = Object.assign(obj, result._serverData);
            return result;
        })
    }
}

new FakeUser().from("test");