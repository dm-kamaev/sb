'use strict';

module.exports = function prettyJSON (obj) {
    if (typeof obj === 'string') {
        return obj;
    } else {
        return JSON.stringify(obj, function(key, value) {
            if (key && value === obj) {
                return '[Circular]';
            }
            return value;
        }, 2);
    }
};
