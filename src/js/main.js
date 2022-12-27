new Vue({
    el: '#resume',
    data: {
        avatar_url: my_avatar,
        motto: my_motto,
        mail: my_mail,
        tel: my_tel,
        wechat: my_wechat,
        qq: my_qq,
        name: my_name,
        gender: my_gender,
        undergraduate: my_undergraduate,
        postgraduate: my_postgraduate,
        working_year: my_working_year,
        edu_background: my_edu_background,
        blog: my_blog,
        github: my_github,
        intro: my_intro,
        want: my_want,
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
    el: '#footer',
    data: {
        github: my_github,
        theme: my_theme,
        pdf_resume: my_pdf_resume,
        latest_update: my_latest_update,
    },
    i18n,
});
