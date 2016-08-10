'use strict';

var service = {};

service.concatUrl = function(urlTail) {
    return 'http://localhost:3000/' + urlTail;
};

module.exports = service;
