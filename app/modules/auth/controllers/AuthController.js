/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const errors = require('../../../components/errors');
const userService = require('../../user/services/userService');
const authService = require('../services/authService');
const userFundService = require('../../userFund/services/userFundService');
const mailService = require('../services/mailService');
const os = require('os');
const config = require('../../../../config/config');

const HOSTNAME = `http://${os.hostname()}:${config.port}`
const VERIFY_LINK = `${HOSTNAME}/auth/verify?token=`;
const RECOVER_LINK = `${HOSTNAME}/auth/recover?token=`;
const SUCCESS_MAIL_REDIRECT = `${HOSTNAME}#success?type=mail`;
const FAILURE_MAIL_REDIRECT = `${HOSTNAME}#failure?type=mail`;
const getVerifyLink_ = token => VERIFY_LINK + token;
const getRecoverLink_ = token => RECOVER_LINK + token;

class AuthController extends Controller {
    /**
     * @api {post} /auth find or create user
     * @apiName find or create user
     * @apiGroup AuthOld
     *
     * @apiParam {String} [firstName] user fist name
     * @apiParam {String} [lastName] user last name
     * @apiParam {String} phone phone number
     *
     * @apiParamExample {json} Example request:
     * {
     *     "firstName": "Max",
     *     "lastName": "Rylkin"
     * }
     * @apiSuccess {Object} User created user
     *
     * @apiError (Error 422) ValidationError
     *
     */
    actionFindOrCreateUser(actionContext) {
        var userData = actionContext.request.body,
            phoneData = actionContext.request.user.phone,
            firstName = userData.firstName,
            lastName = userData.lastName;

        if (!phoneData || !phoneData.verified) {
            throw new errors.HttpError('Unathorized', 403);
        }

        userData.phone = phoneData.number;

        try {
            var authUser = await(authService.createAuthUser(userData));

            var sberUser = actionContext.request.user;
            await(userService.setAuthId(sberUser.id, authUser.id));

            return await(new Promise((resolve, reject) => {
                actionContext.request.login(sberUser, (err) => {
                    if (err) reject(new errors.HttpError(err.message, 400));
                    resolve(actionContext.request.sessionID);
                });
            }));
        } catch (err) {
            if (err.name == 'ValidationError') {
                throw new errors.ValidationError(err.validationErrors);
            }
            throw err;
        }
    };
    /**
     * @api {post} /auth/logout logout
     * @apiName logout
     * @apiGroup Auth
     *
     */
    actionLogout(actionContext) {
        return actionContext.request.logout();
    };
    /**
     * @api {get} /auth/test test
     * @apiName test
     * @apiGroup Auth
     */
    actionTest(actionContext) {
        return actionContext.request.user;
    };
    /**
     * @api {post} /auth/sms send sms
     * @apiName send sms
     * @apiGroup AuthOld
     *
     * @apiParamExample {json} example request:
     * {
     *    "phone": "123456789"
     * }
     *
     * @apiError (Error 400) TimerError
     */
    actionSendSMS(actionContext) {
        var phone = actionContext.request.body.phone,
            userId = actionContext.request.user.id,
            code = ('000' + ~~(Math.random() * 990 + 1)).slice(-3);

        try {
            await(authService.saveCode(phone, code, userId));
            await(authService.sendCode(phone, code));
            // need for debug
            return code;
            return null;
        } catch (err) {
            throw new errors.HttpError(err.message, 400);
        }
    };
    /**
     * @api {post} /auth/verify verify code
     * @apiName verify code
     * @apiGroup AuthOld
     *
     * @apiParamExample {json} example request:
     * {
     *    "code": "123"
     * }
     *
     * @apiError (Error 400) HttpError wrong code
     * @apiError (Error 403) HttpError Unathorized sms not sent yet.
     * @apiError (Error 400) HttpError Already logged in
     */
    actionVerifyCode(actionContext) {
        var phoneData = actionContext.request.user.phone;

        if (!phoneData) throw new errors.HttpError('Unathorized', 403);

        var sessionUser = actionContext.request.user,
            phone = sessionUser.phone.number,
            code = actionContext.request.body.code;

        var res = await(authService.verifyCode(phone, code));
        if (!res[0]) throw new errors.HttpError('Wrong code', 400);

        var authUser = await(userService.findAuthUserByPhone(phone));
        if (!authUser) return {
            data: 'need register'
        };

        var sberUser = await(userService.findSberUserByAuthId(authUser.id));

        if (!sberUser) {
            sberUser = sessionUser;
            await(userService.setAuthId(sberUser.id, authUser.id));
        } else if (!sberUser.userFund.enabled &&
            await(userFundService.getEntities(sessionUser.id)).length) {
            await(userService.setUserFund(sberUser.id, sessionUser.userFund.id));
        }


        return await(new Promise((resolve, reject) => {
            actionContext.request.login(sberUser, (err) => {
                if (err) reject(new errors.HttpError(err.message, 400));
                resolve(actionContext.request.sessionID);
            });
        }));
    };
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
     */
    actionRegister(ctx) {
        var userData = ctx.data;

        try {
            var authUser = await(authService.register(userData));
            var token = await(authService.generateToken({
              email: userData.email
            }));
            await(mailService.sendMail(userData.email, VERIFY_LINK + token));
            var sberUser = ctx.request.user || userService.createSberUser(authUser.id);
            await(userService.setAuthId(sberUser.id, authUser.id));

            // ctx.status = 201;

            return await(new Promise((resolve, reject) => {
                ctx.request.login(sberUser, (err) => {
                    if (err) reject(new errors.HttpError(err.message, 400));
                    resolve(ctx.request.sessionID);
                });
            }));
        } catch (err) {
            if (err.name == 'ValidationError') {
                throw new errors.ValidationError(err.validationErrors);
            }
            throw err;
        }
    };
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
    actionLogin(ctx) {
        var email = ctx.data.email,
            password = ctx.data.password,
            sessionUser = ctx.request.user;

        try {
            await(authService.login(email, password));

            var authUser = await(userService.findAuthUserByEmail(email));
            var sberUser = await(userService.findSberUserByAuthId(authUser.id));

            if (!sberUser) {
                sberUser = sessionUser || userService.createSberUser(authUser.id);
                await(userService.setAuthId(sberUser.id, authUser.id));
            } else if (!sberUser.userFund.enabled && sessionUser &&
                await(userFundService.getEntities(sessionUser.id)).length) {
                await(userService.setUserFund(sessionUser.userFund.id, sberUser.userFund.id));
            }

            return await(new Promise((resolve, reject) => {
                ctx.request.login(sberUser, (err) => {
                    if (err) reject(new errors.HttpError(err.message, 400));
                    resolve(ctx.request.sessionID);
                });
            }));
        } catch (err) {
            throw new errors.NotFoundError('User');
        }
    };
    /**
     * @api {get} /auth/verify verify email
     * @apiName Verify email
     * @apiGroup Auth
     *
     * @apiParam {String} token jwt token
     */
    actionVerifyEmail(ctx) {
        var token = ctx.request.query.token;
        try {
            var email = await(authService.verifyToken(token)).email;
            console.log(email);
        } catch (err) {
            if (err.name == 'TokenExpiredError') {
                ctx.response.redirect(FAILURE_MAIL_REDIRECT)
                throw new errors.HttpError('Link expired', 410);
            }
            throw new errors.HttpError('Invalid token', 400);
        }
        var authUser = await(userService.findAuthUserByEmail(email));
        var sberUser = await(userService.findSberUserByAuthId(authUser.id));
        var verified = await(authService.verifyUser(sberUser.id));

        ctx.response.redirect(SUCCESS_MAIL_REDIRECT);
    };
    /**
     * @api {post} /auth/send send verification mail
     * @apiName send verification mail
     * @apiGroup Auth
     */
    actionSendVerification(ctx) {
        var sberUser = ctx.request.user;
        if (!sberUser || !sberUser.authId) throw new errors.HttpError('Unathorized', 403);
        if (sberUser.verified) throw new errors.HttpError('Already verified', 403);

        var authUser = await(userService.findAuthUserByAuthId(sberUser.authId)),
            email = authUser.email;

        var token = await(authService.generateToken({
            email
        }));
        var letterText = await(mailService.sendMail(email,
            VERIFY_LINK + token));
        // need for debug
        // TODO: remove
        return letterText;
        return null;
    };

    actionRecoverPassword(ctx) {
        var token = ctx.request.data.token,
            password = ctx.data.password
    };
    /**
     * @api {post} /auth/recover recover password
     * @apiName recover password
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
        if (sessionUser && sessionUser.authId) throw new errors.HttpError('Already logged in', 403);

        var email = ctx.data.email,
            authUser = userService.findAuthUserByEmail(email),
            sberUser = userService.findSberUserByAuthId(authUser.id);

        var token = authService.generateToken({
            id: sberUser.id
        });
        var letterText = await(mailService.sendMail(email, getRecoverLink_(token)));
            // TODO: remove
        return letterText;
    }
}

module.exports = AuthController;
