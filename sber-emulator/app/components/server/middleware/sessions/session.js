const SECRET = require('./secret').secret;
const Session = require('express-session');
const SequelizeStore =
    require('connect-session-sequelize')(Session.Store);
const uid = require('uid-safe').sync;
const sequelize = require('../../../sequelize/sequelize');

module.exports = Session({
    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    name: 'connect.sid',
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
    store: new SequelizeStore({
        db: sequelize
    }),
    genid: function(req) {
        return req.body && req.body.sessionId || uid(24);
    }
});
