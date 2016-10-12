'use strict';

// Wrapper for passport.js
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util   = require('util');


module.exports = class PasswordAuth {
    /**
     * [constructor description]
     * @param  {[obj]} params {
     *   // object from express
     *   ctx: { request, response }
     *  }
     * @return {[type]}        [description]
     */
    constructor (params) {
        if (!params.ctx) { throw new Error('PasswordAuth: not exist ctx '+params.ctx);}
        var ctx = params.ctx;
        if (!ctx.request) {
            throw new Error('PasswordAuth: not exist request in ctx '+ctx.request);
        }
        if (!ctx.response) {
            throw new Error('PasswordAuth: not exist response in ctx '+ctx.response);
        }
        this.request  = ctx.request;
        this.response = ctx.response;
    }


    /**
     * authorization via passport.js
     * @param  {[int]} sberUser
     * @return {[str]}  "vJkm3r2XYW71DTqmWp3MgpCD0Qo7XdO8"
     */
    login(sberUser) {
        var request = this.request;
        try {
            return await(new Promise(function (resolve, reject) {
                request.login(sberUser, (err) => {
                    if (err) { return reject(err); }
                    resolve({ resolve:true, data: request.sessionID });
                })
            }));
        } catch (err) {
            return { resolve:false, message: err.message || err };
        }
    }


    logout() {
        var request = this.request;
        return request.logout();
    }


    /**
     * redirect only if request skip SPA
     * @param  {[str]} url
     * @return {[type]}
     */
    redirect(url) {
        var response = this.response;
        response.redirect(url);
    }
};
