'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util   = require('util');
const JWT_SECRET = require('../../../../config/config').jwt_secret;
const jwt = require('jsonwebtoken');

/**
 * Wrapper for jsonwebtoken
 * @type {[type]}
 */
module.exports = class Jwt {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   options: {}, // optional param
     * }
     * @return {[type]}        [description]
     */
    constructor (params) {
       params = params || {};
       this.options = params.options || {};
    }

    /**
     * generate token via jsonwebtoken
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    generateToken (data) {
        var options = this.options;
        try {
            return await (new Promise(function(resolve, reject) {
                jwt.sign(data, JWT_SECRET, options, (err, token) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ resolve:true, data: token });
                });
            }));
        } catch (err) {
            return { resolve:false, message: err.message || err };
        }
    }
};

