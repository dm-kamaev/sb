'use strict';

const session = require('express-session');
const SECRET = require('./secret').secret;
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('../../../sequelize/sequelize');

module.exports = session({
  secret: SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30
  },
  store: new SequelizeStore({
    db: sequelize
  })
})
