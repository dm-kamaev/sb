'use strict';

const session = require('express-session');
const SECRET = require('./secret').secret;
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('../../../sequelize/sequelize');

module.exports = session({
    secret: SECRET,
    saveUninitialized: true,
    resave: false,
    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 30 * 12 * 100
    },
    proxy: true,
    store: new SequelizeStore({
        db: sequelize
    })
});
