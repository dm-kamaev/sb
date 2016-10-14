'use strict';

// methods for work with microservice user and auth
// author: dmitrii kamaev

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util = require('util');
const errors = require('../../../components/errors');
const loggerUser = require('../../../components/logger').getLogger('microServiceUser');
const loggerAuth = require('../../../components/logger').getLogger('microServiceAuth');
const userConfig = require('../../../../config/user-config/config');
const axiosUser = require('axios').create({
    baseURL: `http://${userConfig.host}:${userConfig.port}`
});

const authConfig = require('../../../../config/auth-config/config');
const axiosAuth = require('axios').create({
    baseURL: `http://${authConfig.host}:${authConfig.port}`
});


const MicroServices = {};



MicroServices.UserApi = class {
    constructor() {}


    /**
     * register user
     * @param  {[obj]} params {
     *    "firstName": "Dmitrii",
     *    "lastName": "Kamaev",
     *    "password": "123La123",
     *    "email": "dkamaev@changers.team"
     * }
     * @return {[obj]}   { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
     */
    register (params) {
        try {
            return await(axiosAuth.post('/user', params)).data || {};
        } catch (err) {
            handlerForError_(err, loggerAuth);
        }
    }


    /**
     * login
     * @param  {[obj]}    userData {
     *      email: 'dkamaev@changers.team'
     *      password: '12324131'
     *
     * }
     * @param  {Function} cb       [description]
     * @return {[type]}            [description]
     */
    login(userData, cb) {
        var email = userData.email, password = userData.password;
        try {
            return await(axiosAuth.post(`/user/${email}`, {
                password
            }));
        } catch (err) {
            handlerForError_(err, loggerAuth);
        }
    }


    /**
     * changed user's password
     * @param  {[obj]}   userData {
     *     authId: 21
     *     password: '123456'
     * }
     * @param  {Function} cb       [description]
     * @return {[type]}            [description]
     */
    changePassword (userData) {
        var authId = userData.authId, password = userData.password;
        try {
            return await(
                axiosAuth.put(`/user/${authId}`, { password })
            ).data || {};
        } catch (err) {
            handlerForError_(err, loggerAuth);
        }
    }


    /**
     * get user data
     * @param  {[int]} authId
     * @return {[obj]} { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
     */
    getUserData(authId) {
        try {
            return await (axiosUser.get(`/user/${authId}`)).data || {};
        } catch (err) {
            handlerForError_(err, loggerUser);
        }
    }


    /**
     * get users by params
     * @param  {[obj]} params: { email: 'test@example.ru', id: '1,2' }
     * @return {[obj]} [ { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }, ... ]
     */
    getUserByParams(params) {
        try {
            return await(axiosUser.get('/users', {
                params
            })).data || [];
        } catch (err) {
            handlerForError_(err, loggerUser);
        }
    }


    /**
     * update auth user
     * @param  {[type]} params
     * @return {[type]}  { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
     */
    updateAuthUser(userData) {
        try {
            return await (axiosUser.patch(`/user/${userData.authId}`, {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email:    userData.email || ''
            })).data || {};
        } catch (err) {
           handlerForError_(err, loggerUser);
        }
    }
};

module.exports = MicroServices;


/**
 * handler for Error
 * @param  {[obj]} err
 * @param  {[function]} logger
 * @return {[type]}
 */
function handlerForError_ (err, logger) {
    var textError = (err.data) ? prettyJSON_(err.data) : prettyJSON_(err);
    logger.critical(textError);
    if (err.data) { // Validations error from microservice
        var validationError = err.data[0].message || err.data[0].validationErrors;
        throw new errors.ValidationError(validationError);
    } else { // another error
        throw new errors.MicroServiceError(textError);
    }
}


function prettyJSON_ (obj) {
    if (typeof obj === 'string') { return obj; }
    return util.inspect(obj, { depth: 5 });
}
