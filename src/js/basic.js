AV.init({
    appId: "lqrMXLS0fek11hCZhv8suKq5-gzGzoHsz",
    appKey: "1w38CApjvkOToSWCDz6nrtnb",
    serverURL: "https://lqrmxls0.lc-cn-n1-shared.com"
});

class User {
    id
    userID
    pwd

    contact
    basicInfo
    workExperience
    skills

    constructor(userID, pwd) {
        this.userID = userID;
        this.pwd = pwd;
    }

    tableName() {
        return "user";
    }

    getUserObjectID() {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", this.userID);
        // query.equalTo("pwd", this.pwd);
        return query.first().then((result) => {
            this.id = result.id;
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
            let contact = new Contact("", "", "", "").from(this.id);
            let basicInfo = new BasicInfo().from(this.id);
            let workExperience = new WorkExperience().from(this.id);
            let skills = new Skills().from(this.id);
            return Promise.all([contact, basicInfo, workExperience, skills]).then((val) => {
                this.contact = val[0];
                this.basicInfo = val[1];
                this.workExperience = val[2];
                this.skills = val[3];
                return this;
            })
        })
    }
}

class Contact {
    userID
    tel
    mail
    wechat
    qq

    constructor(tel, mail, wechat, qq) {
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

    tableName() {
        return "basic_info";
    }

    from(userID) {
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.first().then((basic) => {
            let data = basic._serverData;
            this.name = data.name;
            this.gender = data.gender;
            this.edu_background = data.edu_background;
            this.undergraduate = data.undergraduate;
            this.postgraduate = data.postgraduate;
            this.working_year = data.working_year;
            this.blog = data.blog;
            this.github = data.github;
            this.intro = data.intro;
            this.expect = data.expect;
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
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.find().then((wes) => {
            let promises = [];
            wes.forEach((we, index) => {
                let data = we._serverData;
                let exp = new Experience(we.id, data.name, data.logo, data.date);
                promises.push(exp.loadProjects());
            });
            return Promise.all(promises).then((exps) => {
                this.experiences = exps;
                return exps;
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
        query.equalTo("experience_id", this.workExperienceID);
        return query.find().then((ps) => {
            let projects = [];
            ps.forEach((p, idx) => {
                projects.push(new Project(this.workExperienceID, p.name, p.intro, p.techs, p.thumb, p.fame, p.source, p.address, p.github));
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
        let query = new AV.Query(this.tableName());
        query.equalTo("user_id", userID);
        return query.find().then((sks) => {
            let promises = [];
            sks.forEach((sk, idx) => {
                let skill = new Skill(sk.id, sk._serverData.category);
                promises.push(skill.loadSkillContens());
            })
            return Promise.all(promises).then((val) => {
                this.skills = val;
                return val;
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

    loadSkillContens() {
        let query = new AV.Query("skill_content");
        query.equalTo("skill_id", this.skillID);
        return query.find().then((cts) => {
            console.log("contens:", cts)
            let contents = [];
            cts.forEach((c, idx) => {
                contents.push(new SkillContent(this.skillID, c._serverData.name, c._serverData.intro));
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

let us = new User("test", "");
us.load().then((u) => {
    console.log("user:", u);
    console.log("users:", us);
});

let user = new User("test", "");
user.load().then((user) => {
    new Vue({
        // el: '#resume',
        data: {
            avatar_url: "",
            motto: "",

            mail: user.contact.mail,
            tel: user.contact.tel,
            wechat: user.contact.wechat,
            qq: user.contact.qq,

            name: user.basicInfo.name,
            gender: user.basicInfo.gender,
            undergraduate: user.basicInfo.undergraduate,
            postgraduate: user.basicInfo.postgraduate,
            working_year: user.basicInfo.working_year,
            edu_background: user.basicInfo.edu_background,
            blog: user.basicInfo.blog,
            github: user.basicInfo.github,
            intro: user.basicInfo.intro,
            want: user.basicInfo.expect,

            experience: my_experience,
            projects: my_projects,
            skills: my_skills,
            i18n: i18n,
            langs: langs,
        },
        methods: {
            select_lang(lang) {
                this.i18n.locale = lang;
            }
        },
        i18n
    });
    
    new Vue({
        // el: '#footer',
        data: {
            github: my_github,
            theme: my_theme,
            pdf_resume: my_pdf_resume,
            latest_update: my_latest_update,
        },
        i18n,
    });
    
});