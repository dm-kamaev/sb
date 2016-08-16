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
const VERIFY_LINK = `http://${os.hostname()}:3000/auth/verify?token=`;

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
     * @api /auth/register register
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
            var token = await(authService.generateToken(userData.email));
            await(mailService.sendMail(userData.email, VERIFY_LINK + token));

            var sberUser = ctx.request.user;
            await(userService.setAuthId(sberUser.id, authUser.id));

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
     * @api /auth/login login
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
                sberUser = sessionUser;
                await(userService.setAuthId(sberUser.id, authUser.id));
            } else if (!sberUser.userFund.enabled &&
                await(userFundService.getEntities(sessionUser.id)).length) {
                await(userService.setUserFund(sberUser.id, sessionUser.userFund.id));
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
        } catch (err) {
            if (err.name == 'TokenExpiredError') {
                throw new errors.HttpError('Link expired', 410);
            }
            throw new errors.HttpError('Invalid token', 400);
        }
        var authUser = await(userService.findAuthUserByEmail(email));
        var sberUser = await(userService.findSberUserByAuthId(authUser.id));
        var verified = await(authService.verifyUser(sberUser.id));

        if (!verified[0]) {
            var errMsg = `User with id ${sberUser.id} already verifed his email`;
            throw new errors.HttpError(errMsg);
        }
    };
    /**
     * @api {post} /auth/send send verification mail
     * @apiName send verification mail
     * @apiGroup Auth
     *
     */
    actionSendVerification(ctx) {
        var sberUser = ctx.request.user;
        if (!sberUser.authId) throw new errors.HttpError('Unathorized', 403);

        var authUser = await(userService.findAuthUserByAuthId(sberUser.authId)),
            email = authUser.email;

        var token = await(authService.generateToken(email));
        var letterText = await(mailService.sendMail(email,
            VERIFY_LINK + token));
        // need for debug
        return letterText;
        return null;
    };
}

module.exports = AuthController;
