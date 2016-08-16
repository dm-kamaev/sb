var logger = require('./logger').getLogger('express');

var Stream = require('stream');
var warningStream = new Stream.Writable({
    write: function(chunk, encoding, next) {
        logger.warning(chunk.toString());
        next();
    }
});
var debugStream = new Stream.Writable({
    write: function(chunk, encoding, next) {
        logger.debug(chunk.toString());
        next();
    }
});
module.exports = {
    warning: warningStream,
    debug: debugStream
};

