AV.init({
    appId: "lqrMXLS0fek11hCZhv8suKq5-gzGzoHsz",
    appKey: "1w38CApjvkOToSWCDz6nrtnb",
    serverURL: "https://lqrmxls0.lc-cn-n1-shared.com"
});

class User {
    id
    pwd

    constructor(id, pwd) {
        this.id = id;
        this.pwd = pwd;
    }

    tableName() {
        return "user";
    }

    getObjectID() {
        let query = new AV.Query(this.tableName());
        query.equalTo("id", this.id);
        // query.equalTo("pwd", this.pwd);
        return query.first().then((result) => {
            console.log(result);
            return result.id;
        }).catch((err) => {
            throw(err);
        });
    }

    simpleAuth() {
        let query = new AV.Query(this.tableName());
        query.equalTo("id", this.id);
        query.equalTo("pwd", this.pwd);
        return query.first().then((result) => {
            return true;
        }).catch((err) => {
            return false;
        });
    }
}

class Contact {
    id
    tel
    mail
    wechat
    qq

    constructor(tel, mail, wechat, qq) {
        this.id = id;
        this.tel = tel;
        this.mail = mail;
        this.wechat = wechat;
        this.qq = qq;
    }

    tableName() {
        return "contact_info"
    }

    save(id) {

    }
}

class BasicInfo {
    id
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

    constructor() {

    }
}

class WorkExperience {
    id
    experiences
}

class Experience {
    id
    name
    logo
    date
    projects
}

class Project {
    id 
    name
    info
    techs
    thumb
    fame
    source
    address
    github
}

class Skills {
    id
    skills
}

class Skill {
    id
    category
    contents
}

class SkillContent {
    id
    name
    intro
}

function LoadResume(id) {
    let us = new User("test", "test");
    us.getObjectID().then((id) => {
        console.log(id)
    })
}
