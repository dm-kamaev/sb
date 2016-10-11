/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const userService = require('../../user/services/userService');
const authService = require('../services/authService');
const userFundService = require('../../userFund/services/userFundService');
const UserApi     = require('../../micro/services/microService.js').UserApi;
const PasswordAuth = require('../services/passwordAuth.js');
const Jwt = require('../services/jwt.js');
const _ = require('lodash');
const mailService = require('../services/mailService');
const os = require('os');
const config = require('../../../../config/config');

const HOSTNAME = `http://${os.hostname()}:${config.port}`;
const VERIFY_LINK = `${HOSTNAME}/auth/verify?token=`;
const RECOVER_LINK = `${HOSTNAME}#recover?token=`;
const SUCCESS_MAIL_REDIRECT = `${HOSTNAME}#success?type=mail`;
const FAILURE_MAIL_REDIRECT = `${HOSTNAME}#failure?type=mail`;
const getVerifyLink_ = token => VERIFY_LINK + token;
const getRecoverLink_ = token => RECOVER_LINK + token;

class AuthController extends Controller {
    /**
     * @api {get} /auth/test test
     * @apiName test
     * @apiGroup Auth
     */
    actionTest(actionContext) {
        return actionContext.request.user;
    }
    /**
     * @api {post} /auth/logout logout
     * @apiName logout
     * @apiGroup Auth
     */
    actionLogout(actionContext) {
        return actionContext.request.logout();
    }
    /**
     * @api {post} /auth/register register
     * @apiName Register
     * @apiGroup Auth
     *
     * @apiParamExample {json} example:
     * {
     *    "firstName": "max",
     *    "lastName": "rylkin",
     *    "password": "123456",
     *    "email": "msrylkin@gmail.com"
     * }
     *
    */
   // {
   //          "email":     "dkamaev@changers.team",
   //          "password":  "123456",
   //          "firstName": "Dmitrii",
   //          "lastName":  "Kamaev"
   //        }
    actionRegister(ctx) {
        var request  = ctx.request,
            userData = ctx.data || {};
        var firstName = _.capitalize(userData.firstName || ''),
            lastName  = _.capitalize(userData.lastName  || ''),
            email     = userData.email && userData.email.toLowerCase(),
            password  = userData.password;
        var data = { firstName, lastName, email, password };
        var tryValid = authService.validateUserData(data);
        if (!tryValid.resolve) { throw new errors.ValidationError(tryValid.message); }

        var authUser = new UserApi().register(data);
        var tryToken = new Jwt().generateToken({ email });
        if (!tryToken.resolve) { throw new errors.HttpError(tryToken.message, 400); }
        var token = tryToken.data;
        mailService.sendMail(userData.email, getVerifyLink_(token));

        var draftUser = request.user || null,
            sberUser  = draftUser || userService.createSberUser(authUser.id);
        if (!sberUser.authId) { userService.setAuthId(sberUser.id, authUser.id); }

        var tryLogin = new PasswordAuth({ ctx }).login(sberUser);
        if (!tryLogin.resolve) { throw new errors.HttpError(tryLogin.message, 400); }
        return tryLogin.data;
    }
    /**
     * @api {post} /auth/login login
     * @apiName Login
     * @apiGroup Auth
     *
     * @apiParamExample {json} example:
     * {
     *   "email": "msrylkin@gmail.com",
     *   "password": "123456"
     * }
     */
    /*{
      "email": "dkamaev@changers.team",
      "password": "123456"
    }*/
    actionLogin(ctx) {
        var data    = ctx.data    || {},
            request = ctx.request || {};
        var email       = data.email && data.email.toLowerCase(),
            password    = data.password,
            sessionUser = request.user;

        new UserApi().login({ email, password });
        var tryLogin = new PasswordAuth({ ctx }).login(
            checkSberUserOrSetUserFund_({ email, sessionUser })
        );
        if (!tryLogin.resolve) { throw new errors.HttpError(tryLogin.message, 400); }

        return tryLogin.data;
    }


    /**
     * @api {get} /auth/verify verify email
     * @apiName Verify email
     * @apiGroup Auth
     *
     * @apiParam {String} token jwt token
     */
    actionVerifyEmail(ctx) {
        var token = ctx.request.query.token;

        return await(new Promise((resolve, reject) => {
            authService.verifyToken(token, async((err, decoded) => {
                if (err) { return ctx.response.redirect(FAILURE_MAIL_REDIRECT); }
                if (err && err.name !== 'JsonWebTokenError') { logger.critical(err); }

                var authUser = userService.findAuthUserByEmail(decoded.email);
                var sberUser = userService.findSberUserByAuthId(authUser.id);
                var verified = authService.verifyUser(sberUser.id);

                ctx.response.redirect(SUCCESS_MAIL_REDIRECT);
            }));
        }))
    }

    /**
     * @api {post} /auth/send send verification mail
     * @apiName send verification mail
     * @apiGroup Auth
     */
    actionSendVerification(ctx) {
        var sberUser = ctx.request.user;
        if (!sberUser || !sberUser.authId) {
            throw new errors.HttpError('Unathorized', 403);
        }
        if (sberUser.verified) {
            throw new errors.HttpError('Already verified', 403);
        }

        var authUser = userService.findAuthUserByAuthId(sberUser.authId),
            email = authUser.email;

        return await(new Promise((resolve, reject) => {
            authService.generateToken({
                email
            }, async((err, token) => {
                if (err) { reject(err); }

                var letterText = mailService.sendMail(email, getVerifyLink_(token));
                // TODO: remove
                resolve(letterText);
            }));
        }))
    }

    /**
     * @api {post} /auth/reset reset password
     * @apiName reset password
     * @apiGroup Auth
     *
     * @apiParam {String} password
     * @apiParam {String} token
     *
     * @apiParamExample {json} example:
     * {
     *    "token": "TOKEN",
     *    "password": "123qwe"
     * }
     */
    actionRecoverPassword(ctx) {
        var token = ctx.data.token,
            password = ctx.data.password;

        return await(new Promise((resolve, reject) => {
            authService.verifyToken(token, async((err, decoded) => {
                if (err) { reject(new errors.HttpError(err.message, 400)); }

                var sberUser = userService.findSberUserById(decoded.sberUserId);
                var authUser = userService.findAuthUserByAuthId(sberUser.authId);
                authService.changePassword(authUser.id, password, (err) => {
                    if (err) { reject(err); }
                    resolve()
                });
            }));
        }))
    }
    /**
     * @api {post} /auth/send-reset recover password
     * @apiName send reset password mail
     * @apiGroup Auth
     *
     * @apiParam {String} email email of account owner
     * @apiParamExample {json} example:
     * {
     *    "email": "msrylkin@gmail.com"
     * }
     */
    actionSendRecoverEmail(ctx) {
        var sessionUser = ctx.request.user;

        var email = ctx.data.email && ctx.data.email.toLowerCase(),
            authUser = userService.findAuthUserByEmail(email);

        if (!authUser) { throw new errors.NotFoundError('User', email); }

        var sberUser = userService.findSberUserByAuthId(authUser.id);

        return await(new Promise((resolve, reject) => {
            authService.generateToken({
                sberUserId: sberUser.id
            }, {
                expiresIn: '2 days'
            }, async((err, token) => {
                if (err) { reject(err); }
                var letterText = mailService.sendMail(email,
                    getRecoverLink_(token),
                    'Восстановление пароля');
                // TODO: remove
                resolve(letterText);
            }));
        }))
    }
}

module.exports = AuthController;


/**
 * if not exist sberUser then create id for him
 * if user authorized on another device (example phone) and create draft userFund
 * then set the user current draft userFund (example web-page)
 * @param  {[obj]} params { email, sessionUser }
 * @return {[int]}        sberUser
 */
function checkSberUserOrSetUserFund_(params) {
    var email = params.email, sessionUser = params.sessionUser;
    var authUser = userService.findAuthUserByEmail(email),
        sberUser = userService.findSberUserByAuthId(authUser.id);

    if (!sberUser) {
        sberUser = sessionUser || userService.createSberUser(authUser.id);
        userService.setAuthId(sberUser.id, authUser.id);
    } else if (!sberUser.userFund.enabled &&
        sessionUser &&
        userFundService.getEntities(sessionUser.id).length
    ) {
        userService.setUserFund(sessionUser.userFund.id, sberUser.userFund.id);
    }
    return sberUser;
}