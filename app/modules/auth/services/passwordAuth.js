'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util   = require('util');


module.exports = class PasswordAuth {
    /**
     * [constructor description]
     * @param  {[obj]} params { ctx: "object from express" }
     * @return {[type]}        [description]
     */
    constructor (params) {
        if (!params.ctx) {
            throw new Error('PasswordAuth: not exist ctx '+params.ctx);
        } else if (!params.ctx.request) {
            throw new Error('PasswordAuth: not exist request in ctx '+params.ctx.request);
        } else {
            this.request = params.ctx.request;
        }
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
};

