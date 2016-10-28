'use strict';

const SECRET = require('./secret').secret;
const signature = require('cookie-signature');
const cookie = require('cookie');

module.exports = function(request, response, next) {
    var signedCookie = 's:' + signature.sign(request.sessionID, SECRET);
    response.set('X-Session-Cookie', cookie.serialize('connect.sid', signedCookie));
    next();
};
