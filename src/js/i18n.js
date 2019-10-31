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