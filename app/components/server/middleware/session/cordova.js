'use strict';

const SECRET = require('./secret').secret;
const signature = require('cookie-signature');
const cookie = require('cookie');

module.exports = function(request, response, next) {
    var sid = request.get('X-Session-Id');
    if (sid) {
        var signedCookie = 's:' + signature.sign(sid, SECRET);
        request.headers.cookie = cookie.serialize('connect.sid', signedCookie);
    }
    next();
};
