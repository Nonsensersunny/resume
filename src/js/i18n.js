const messages = {
    "en": {
        message: en
    },
    "zh": {
        message: zh
    },
}

const langs = {
    "en": "English",
    "zh": "中文"
}

const i18n = new VueI18n({
    locale: 'zh',
    messages
})

//
function I18nObj(zh, en) {
    this.zh = zh;
    this.en = en;
    this.getZh = function() {
        return this.zh;
    }
    this.getEn = function() {
        return this.en;
    }
}
