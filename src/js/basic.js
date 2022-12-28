AV.init({
    appId: "lqrMXLS0fek11hCZhv8suKq5-gzGzoHsz",
    appKey: "1w38CApjvkOToSWCDz6nrtnb",
    serverURL: "https://lqrmxls0.lc-cn-n1-shared.com"
});

class User {
    id
    userID
    pwd
    updateCnt
    viewCnt
    lastUpdated

    contact
    basicInfo
    workExperience
    personalProjects
    skills
    settings

    constructor(userID, pwd="") {
        this.userID = userID;
        this.pwd = pwd;
    }

    tableName() {
        return "user";
    }

    getUserObjectID() {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", this.userID);
        return query.first().then((result) => {
            this.id = result.id;
            this.updateCnt = result.get("update_cnt");
            this.viewCnt = result.get("view_cnt");
            this.lastUpdated = result.get("updatedAt");
            return result.id;
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

    load() {
        return this.getUserObjectID().then((userID) => {
            let contact = new Contact().from(this.id);
            let basicInfo = new BasicInfo().from(this.id);
            let workExperience = new WorkExperience().from(this.id);
            let personalProjects = new PersonalProjects().from(this.id);
            let skills = new Skills().from(this.id);
            let settings = new Settings().from(this.id);
            return Promise.all([contact, basicInfo, workExperience, personalProjects, skills, settings]).then((val) => {
                this.contact = val[0];
                this.basicInfo = val[1];
                this.workExperience = val[2];
                this.personalProjects = val[3];
                this.skills = val[4];
                this.settings = val[5];
                this.updateViewCnt();
                return this;
            })
        })
    }

    updateViewCnt() {
        let query = new AV.Object.createWithoutData(this.tableName(), this.id);
        query.increment("view_cnt", 1);
        query.save();
    }

    updateUpdateCnt() {
        let query = new AV.Object.createWithoutData(this.tableName(), this.id);
        query.increment("update_cnt", 1);
        query.set("last_updated", Date.now());
        query.save();
    }

    render() {
        // this.settings.render();
        new Vue({
            el: '#resume',
            data: {
                contact: this.contact,
                basicInfo: this.basicInfo,
                workExperience: this.workExperience,
                skills: this.skills,
                projects: this.personalProjects,
                i18n: i18n,
                langs: langs,
                settings: this.settings,
            },
            methods: {
                select_lang(lang) {
                    this.i18n.locale = lang;
                }
            },
            i18n
        });
        
        new Vue({
            el: '#footer',
            data: {
                basicInfo: this.basicInfo,
                lastUpdated: this.lastUpdated,
            },
            i18n,
        });        
    }

    listen() {
        Promise.all([this.settings.listen()]).then((val) => {
            this.settings.render();
        });
    }
}

class Contact {
    userID
    tel
    mail
    wechat
    qq

    constructor(tel="", mail="", wechat="", qq="") {
        this.tel = tel;
        this.mail = mail;
        this.wechat = wechat;
        this.qq = qq;
    }

    tableName() {
        return "contact_info";
    }

    from(userID) {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.first().then((contact) => {
            let data = contact._serverData;
            this.tel = data.tel;
            this.mail = data.mail;
            this.wechat = data.wechat;
            this.qq = data.qq;
            this.userID = userID;
            return this;
        })
    }
}

class BasicInfo {
    userID
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

    tableName() {
        return "basic_info";
    }

    from(userID) {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.first().then((basic) => {
            this.avatar = basic.get("avatar");
            this.motto = ExtractI18nValue(basic, "motto");
            this.name = ExtractI18nValue(basic, "name");
            this.gender = ExtractI18nValue(basic, "gender");
            this.edu_background = ExtractI18nValue(basic, "edu_background");
            this.undergraduate = ExtractI18nValue(basic, "undergraduate");
            this.postgraduate = ExtractI18nValue(basic, "postgraduate");
            this.working_year = ExtractI18nValue(basic, "working_year");
            this.blog = basic.get("blog");
            this.github = ExtractGitHubValue(basic.get("github"));
            this.intro = ExtractI18nValue(basic, "intro");
            this.expect = ExtractI18nValue(basic, "expect");
            this.pdf_resume = basic.get("pdf_resume");
            this.userID = userID;
            return this;
        })
    }
}

class WorkExperience {
    userID
    experiences

    tableName() {
        return "work_experience";
    }

    from(userID) {
        this.userID = userID;
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.find().then((wes) => {
            let promises = [];
            wes.forEach((we, index) => {
                let exp = new Experience(we.id, 
                    ExtractI18nValue(we, "name"),
                    we.get("logo"), 
                    we.get("date"));
                promises.push(exp.loadProjects());
            });
            return Promise.all(promises).then((exps) => {
                this.experiences = exps;
                return this;
            });
        })
    }
}

class Experience {
    workExperienceID
    name
    logo
    date
    projects

    constructor(workExperienceID, name, logo, date) {
        this.workExperienceID = workExperienceID;
        this.name = name;
        this.logo = logo;
        this.date = date;
    }

    loadProjects() {
        let query = new AV.Query("project");
        console.log("exp id:", this.workExperienceID);
        query.equalTo("experience_id", this.workExperienceID);
        query.equalTo("is_personal", false);
        return query.find().then((ps) => {
            let projects = [];
            ps.forEach((p, idx) => {
                projects.push(new Project(this.workExperienceID, 
                    ExtractI18nValue(p, "name"), 
                    ExtractI18nValue(p, "intro"), 
                    ExtractI18nValue(p, "techs"), 
                    p.get("thumb"),
                    ExtractI18nValue(p, "fame"), 
                    p.get("source"),
                    p.get("address"), 
                    p.get("github")));
            })
            this.projects = projects;
            return this;
        })
    }
}

class PersonalProjects {
    userID
    projects
    
    from(userID) {
        this.userID = userID;
        let query = new AV.Query("project");
        query.equalTo("user_id", this.userID);
        query.equalTo("is_personal", true);
        return query.find().then((ps) => {
            let projects = [];
            ps.forEach((p, idx) => {
                projects.push(new Project(this.workExperienceID, 
                    ExtractI18nValue(p, "name"), 
                    ExtractI18nValue(p, "intro"), 
                    ExtractI18nValue(p, "techs"), 
                    p.get("thumb"),
                    ExtractI18nValue(p, "fame"), 
                    p.get("source"),
                    p.get("address"), 
                    p.get("github")));
            })
            this.projects = projects;
            return this;
        })
    }
}

class Project {
    experienceID 
    name
    intro
    techs
    thumb
    fame
    source
    address
    github

    constructor(expID, name, intro, techs, thumb, fame, source, address, github) {
        this.experienceID = expID;
        this.name = name;
        this.intro = intro;
        this.techs = techs;
        this.thumb = thumb;
        this.fame = fame;
        this.source = source;
        this.address = address;
        this.github = github;
    }
}

class Skills {
    userID
    skills

    tableName() {
        return "skill";
    }

    from(userID) {
        this.userID = userID;
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.find().then((sks) => {
            let promises = [];
            sks.forEach((sk, idx) => {
                let skill = new Skill(sk.id, ExtractI18nValue(sk, "category"));
                promises.push(skill.loadSkillContents());
            })
            return Promise.all(promises).then((val) => {
                this.skills = val;
                return this;
            })
        })
    }
}

class Skill {
    skillID
    category
    contents

    constructor(skillID, category) {
        this.skillID = skillID;
        this.category = category;
    }

    loadSkillContents() {
        let query = new AV.Query("skill_content");
        query.equalTo("skill_id", this.skillID);
        return query.find().then((cts) => {
            let contents = [];
            cts.forEach((c, idx) => {
                contents.push(new SkillContent(this.skillID, 
                    ExtractI18nValue(c, "name"),
                    ExtractI18nValue(c, "intro")));
            })
            this.contents = contents;
            return this;
        })
    }
}

class SkillContent {
    skillID
    name
    intro

    constructor(skillID, name, intro) {
        this.skillID = skillID;
        this.name = name;
        this.intro = intro;
    }
}

function I18nObj(zhVal, enVal="") {
    if (zhVal === undefined) {
        zhVal = "";
    }
    return {
        en: enVal,
        zh: zhVal,
    };
}

function ExtractI18nValue(obj, field) {
    return I18nObj(obj.get(field), obj.get(field+"_en"));
}

function ExtractGitHubValue(val) {
    let resp = {
        name: "GitHub",
        url: "https://github.com/Nonsensersunny"
    };
    if (val === undefined) {
        return resp;
    }
    resp.name = val.replace("https://github.com/", "");
    resp.url = val;
    return resp;
}

class Settings {
    userID
    langSwitch
    expectSwitch
    introDisplaySwitch

    constructor(langSwitch=false, expectSwitch=false, introDisplaySwitch) {
        this.langSwitch = langSwitch;
        this.expectSwitch = expectSwitch;
        this.introDisplaySwitch = introDisplaySwitch;
    }

    tableName() {
        return "settings";
    }

    from(userID) {
        this.userID = userID;
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.first().then((setting) => {
            this.langSwitch = setting.get("lang_switch");
            this.expectSwitch = setting.get("expect_switch");
            this.introDisplaySwitch = setting.get("intro_display_switch");
            resumeSetting = this;
            return this;
        })
    }

    listen() {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", this.userID);
        return query.subscribe().then((lq) => {
            return lq.on('update', (updatedObj, updatedKeys) => {
                this.langSwitch = updatedObj.get("lang_switch");
                this.expectSwitch = updatedObj.get("expect_switch");
                this.introDisplaySwitch = updatedObj.get("intro_display_switch");
                resumeSetting = this;
                return this;
            })
        })
    }
}

// load user
let user = new User("test");
user.load().then((user) => {
    user.render();
    console.log(user);
    // user.listen();
});
