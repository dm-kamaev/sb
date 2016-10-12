'use strict';

// Wrapper for jsonwebtoken
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util   = require('util');
const JWT_SECRET = require('../../../../config/config').jwt_secret;
const jwt = require('jsonwebtoken');


module.exports = class Jwt {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   // optional param
     *   options: {
     *       expiresIn: '2 days'
     *   },
     * }
     * @return {[type]}        [description]
     */
    constructor (params) {
       params = params || {};
       this.options = params.options || {};
    }

    /**
     * generate token via jsonwebtoken
     * @param  {[obj]} data  { email: 'test@example.ru' }
     * @return {[type]}      { resolve: true || false, data: token, message: Error }
     */
    generateToken (data) {
        var options = this.options;
        try {
            return await(new Promise(function(resolve, reject) {
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


    /**
     * verify token
     * @param  {[str]} token
     * @return {[str]}
     */
    verifyToken(token) {
        try {
            return await(new Promise(function(resolve, reject) {
                jwt.verify(token, JWT_SECRET, (err, decoded) => {
                    if (err) { return reject(err); }
                    resolve({ resolve:true, data: decoded });
                });
            }));
        } catch (err) {
            return { resolve:false, message: err.message || err };
        }
    }

};

