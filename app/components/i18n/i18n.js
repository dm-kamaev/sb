'use strict';

const i18n = require('i18n');
const path = require('path');

i18n.configure({
    locales: ['en', 'ru'],
    directory: path.join(__dirname, 'locales'),
    defaultLocale: 'ru'
});

module.exports = i18n;

