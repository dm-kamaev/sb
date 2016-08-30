'use strict';

const request = require('request');
const await = require('asyncawait/await');


/**
 * [post description]
 * @param  {[string]} url
 * @param  {[obj]}    data
 * @return {[promise]}
 */
exports.post = function(url, data) {
    return await(new Promise(function(resolve, reject) {
        request.post({
            url,
            formData: data
        }, function(err, httpResponse, body) {
            if (err) {
                reject(err);
            } else {
                resolve({ httpResponse, body });
            }
        });
    }));
};
