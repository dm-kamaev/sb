/* eslint-disable require-jsdoc, valid-jsdoc*/
'use strict';

const Controller = require('nodules/controller').Controller;
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const userService = require('../../user/services/userService');
const authService = require('../services/authService');
const logger = require('../../../components/logger').getLogger('main');
const userFundService = require('../../userFund/services/userFundService');
const UserApi     = require('../../micro/services/microService.js').UserApi;
const PasswordAuth = require('../services/passwordAuth.js');
const Jwt = require('../services/jwt.js');
const UserValidation = require('../services/userValidation.js');
const _ = require('lodash');
const os = require('os');
const config = require('../../../../config/config');
const userFundStatus = require('../../userFund/enum/userFundStatus');
const mail = require('../../mail');

const HOSTNAME = `${config.hostname.replace(/\/+$/, '')}:${config.port}`;
const VERIFY_LINK = `${HOSTNAME}/auth/verify?token=`;
const RECOVER_LINK = `${HOSTNAME}#registration?token=`;
const SUCCESS_MAIL_REDIRECT = `${HOSTNAME}#success?type=mail`;
const FAILURE_MAIL_REDIRECT = `${HOSTNAME}#failure?type=mail`;
const getVerifyLink_ = token => VERIFY_LINK + token;
const getRecoverLink_ = (token, email) => `${RECOVER_LINK}${token}&email=${email}`;

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
    actionLogout(ctx) {
        return new PasswordAuth({ ctx }).logout();
    }
    /**
     * @api {post} /auth/register register
     * @apiName register
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
     * @apiSuccess {str} token
     * @apiError (Error 422) Validation error for user's data
     * @apiError (Error 400) HttpError generate for token or login via passport
    */
   // {
   //          "email":     "dkamaev@changers.team",
   //          "password":  "123456",
   //          "firstName": "Dmitrii",
   //          "lastName":  "Kamaev"
   //        }
    actionRegister(ctx) {
        var passwordAuth = new PasswordAuth({ ctx });
        var firstName = _.capitalize(passwordAuth.getPostData('firstName')),
            lastName  = _.capitalize(passwordAuth.getPostData('lastName')),
            email     = passwordAuth.getPostData('email').toLowerCase(),
            password  = passwordAuth.getPostData('password');
        var data = { firstName, lastName, email, password };
        var resValid = new UserValidation().getValidationFor('all').check(data);
        if (resValid) { throw new errors.ValidationError(resValid); }

        var authUser = new UserApi().register(data);
        var tryToken = new Jwt().generateToken({ email });
        if (!tryToken.resolve) { throw new errors.HttpError(tryToken.message, 400); }
        var token = tryToken.data;
        mail.sendConfirmation(email, {
            userName: firstName,
            link: getVerifyLink_(token)
        });

        var user      = passwordAuth.getUser(),
            draftUser = _.isEmpty(user) ? null : user,
            sberUser  = draftUser || userService.createSberUser(authUser.id);
        if (!sberUser.authId) { userService.setAuthId(sberUser.id, authUser.id); }

        var tryLogin = passwordAuth.login(sberUser);
        if (!tryLogin.resolve) { throw new errors.HttpError(tryLogin.message, 400); }
        return tryLogin.data;
    }


    /**
     * @api {post} /auth/login login
     * @apiName login
     * @apiGroup Auth
     *
     * @apiParamExample {json} example:
     * {
     *   "email": "msrylkin@gmail.com",
     *   "password": "123456"
     * }
     * @apiSuccessExample {Object}
     * {
     *     status, //userFund
     *     sid     //token
     * }
     * @apiError (Error 400) HttpError login via passport
     */
    /*{
      "email": "dkamaev@changers.team",
      "password": "123456"
    }*/
    actionLogin(ctx) {
        var passwordAuth = new PasswordAuth({ ctx }),
            email        = passwordAuth.getPostData('email').toLowerCase(),
            password     = passwordAuth.getPostData('password'),
            user         = passwordAuth.getUser(),
            sessionUser  = (_.isEmpty(user)) ? null : user;

        new UserApi().login({ email, password });

        var sberUser = authService.checkSberUserOrSetUserFund({ email, sessionUser });

        var tryLogin = new PasswordAuth({ ctx }).login(sberUser);
        if (!tryLogin.resolve) { throw new errors.HttpError(tryLogin.message, 400); }

        var status = sberUser.userFund.enabled ? userFundStatus.ACTIVE :
                    userFundService.countEntities(sberUser.userFund.id)
                    ? userFundStatus.DRAFT : userFundStatus.EMPTY

        return { status, sid: tryLogin.data };
    }


    /**
     * @api {post} /auth/send send verification mail
     * @apiName send verification mail
     * @apiGroup Auth
     *
     * @apiError (Error 400) HttpError generateToken via passport
     */
    actionSendVerification(ctx) {
        var request  = ctx.request  || {},
            sberUser = request.user || {};
        if (!sberUser.authId) { throw new errors.HttpError('Unathorized', 403); }
        if (sberUser.verified){ throw new errors.HttpError('Already verified', 403); }

        var authUser = userService.findAuthUserByAuthId(sberUser.authId),
            email    = authUser.email;
        var tryToken = new Jwt().generateToken({ email });
        if (!tryToken.resolve) { throw new errors.HttpError(tryToken.message, 400); }

        var token = tryToken.data;
        mail.sendConfirmation(email, {
            userName: authUser.firstName,
            link: getVerifyLink_(token)
        })
        return null;
    }


    /**
     * @api {get} /auth/verify verify email
     * @apiName Verify email
     * @apiGroup Auth
     *
     * @apiParam {String} token jwt example: ?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRrYW1hZXZAY2hhbmdlcnMudGVhbSIsImlhdCI6MTQ3NjI2NjI3Mn0.Bke4DvHu_MeR-lFiF9uEBJgCdCiUEyOsnAiKwmZ_jz8
     *
     * @apiError (Error 400) HttpError verifyToken via passport
     */
    // before this function, call actionSendVerification
    actionVerifyEmail(ctx) {
        var request = ctx.request || {},
            token   = (request.query) ? request.query.token : null;

        var tryVerify = new Jwt().verifyToken(token);
        if (!tryVerify.resolve) { throw new errors.HttpError(tryVerify.message, 400); }

        var decoded = tryVerify.data, email = decoded.email;
        var authUser = userService.findAuthUserByEmail(email),
            sberUser = userService.findSberUserByAuthId(authUser.id),
            verified = authService.verifyUser(sberUser.id);

        new PasswordAuth({ ctx }).redirect(SUCCESS_MAIL_REDIRECT);
    }

    /**
     * @api {post} /auth/reset change password
     * @apiName change password
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
     * @apiError (Error 400) HttpError verifyToken via passport
     */
    actionChangePassword(ctx) {
        var data     = ctx.data || {},
            token    = data.token,
            password = data.password;

        var tryVerify = new Jwt().verifyToken(token);
        if (!tryVerify.resolve) { throw new errors.HttpError(tryVerify.message, 400); }
        var decoded    = tryVerify.data,
            sberUserId = decoded.sberUserId;

        var sberUser = userService.findSberUserById(sberUserId);
        var authUser = userService.findAuthUserByAuthId(sberUser.authId),
            authId   = authUser.id;

        var resValid = new UserValidation().getValidationFor('password').check({ password });
        if (resValid) { throw new errors.ValidationError(resValid); }

        new UserApi().changePassword({ authId, password });

        var tryLogin = new PasswordAuth({ ctx }).login(sberUser);
        if (!tryLogin.resolve) { throw new errors.HttpError(tryLogin.message, 400); }

        return null;
    }


    /**
     * @api {post} /auth/send-reset send email for change password
     * @apiName send email for change password
     * @apiGroup Auth
     *
     * @apiParam {String} email email of account owner
     * @apiParamExample {json} example:
     * {
     *    "email": "msrylkin@gmail.com"
     * }
     * @apiError (Error 400) HttpError generateToken via passport
     */
    actionSendEmailForChangePassword(ctx) {
        var request     = ctx.request || {},
            data        = ctx.data    || {},
            sessionUser = request.user;

        var email    = data.email && data.email.toLowerCase(),
            authUser = userService.findAuthUserByEmail(email);

        if (!authUser) { throw new errors.NotFoundError('User', email); }

        var sberUser = userService.findSberUserByAuthId(authUser.id);

        if (!sberUser) sberUser = userService.createSberUser(authUser.id);

        var tryToken = new Jwt({
            expiresIn: '2 days'
        }).generateToken({
            sberUserId: sberUser.id
        });
        if (!tryToken.resolve) { throw new errors.HttpError(tryToken.message, 400); }

        var token = tryToken.data;
        // for debug call return mailService
        mail.sendResetPassword(email, {
            userName: authUser.firstName,
            link: getRecoverLink_(token, encodeURIComponent(email))
        })
        return null;
    }
}

module.exports = AuthController;
