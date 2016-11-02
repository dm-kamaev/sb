'use strict';

const SECRET = require('./secret').secret;
const signature = require('cookie-signature');
const cookie = require('cookie');

module.exports = function(request, response, next) {
    var cookieHeader = request.get('X-Session-Cookie');
    if (cookieHeader){
        request.headers.cookie = cookieHeader;
    }
    next();
};

