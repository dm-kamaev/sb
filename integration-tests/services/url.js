'use strict';

var service = function(urlTail) {
    return 'http://localhost:3000/' + urlTail;
};

service.concatUrl = service;

service.concatEmulUrl = function(urlTail) {
    var url = 'http://localhost:3005/' + urlTail;
    return url;
}

module.exports = service;
