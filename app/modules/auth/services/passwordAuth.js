'use strict';

// Wrapper for passport.js
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const i18n = require('../../../components/i18n');
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

    /**
     * getLoggedIn determine auth
     * @return {[Boolean]}
     */
    getLoggedIn() {
        return Boolean(this.getUser('authId'));
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

    /**
     * getPostData post data from request
     * @param  {[str]} key from request.body
     * @param  {[obj]} option {
     *     required: true || false, // default: true
     * }
     * @return {[any]}
     */
    getPostData(key, option) {
        var body = this.request.body || {};
        option = option || {};
        var required = (option.required !== false) ? true : false;
        if (!key) {
            return body;
        } else {
            var postEl = body[key] || null;
            if (!postEl && required && postEl !== 0 && postEl !== '' && postEl !== false) {
                throw new errors.NotFoundError(
                    i18n.__('Not found field "{{key}}" in POST data {{postEl}}', {
                        key: [key],
                        postEl,
                    })
                );
            }
            return postEl;
        }
    }


     /**
     * get user
     * @param  {[str]} key example: id, email
     * if key not exist return user
     * @return {[obj || any]}
     */
    getUser (key) {
        var user = this.request.user || {};
        if (!key) {
            return user;
        } else {
            var userEl = user[key] || null;
            if (userEl === undefined) {
                throw new errors.NotFoundError(
                    i18n.__('Not found field "{{key}}" in User {{userEl}}', {
                        key: [key],
                        userEl,
                    })
                );
            }
            return userEl;
        }
    }


    /**
     * get UserFund
     * @param  {[str]} key example: id, title, description
     * if key not exist return userFund
     * @return {[obj || any]}
     */
    getUserFund (key) {
        var user     = this.getUser();
        var userFund = user.userFund || {};
        if (!key) {
            return userFund;
        } else {
            var userFundEl = userFund[key] || null;
            if (userFundEl === undefined) {
                throw new errors.NotFoundError(
                    i18n.__('Not found field "{{key}}" in UserFund: {{userFundEl}}', {
                        key: [key],
                        userFundEl,
                    })
                );
            }
            return userFundEl;
        }
    }

    /**
     * check userFund is active or not
     * @return {[Boolean]}
     */
    isNotDraftUserFund() {
        var userFund = this.getUserFund() || {};
        return Boolean(userFund.enabled);
    }

    /**
     * get userFundId from post data owner
     * @return {[int]}
     */
    getUserFundIdFromPostOrOwn() {
        var ownUserFundId         = this.getUserFund().id,
            transferredUserFundId = this.getPostData().userFundId;
        var userFundId = transferredUserFundId || ownUserFundId;
        if (!userFundId) {
            throw new errors.NotFoundError(i18n.__('UserFund'), userFundId);
        }
        return userFundId;
    }
};