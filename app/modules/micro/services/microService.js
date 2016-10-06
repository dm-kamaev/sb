'use strict';

// methods for work with microservice
// author: dmitrii kamaev

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const util = require('util');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('microServiceUser');

const userConfig = require('../../../../config/user-config/config');
const axios = require('axios').create({
    baseURL: `http://${userConfig.host}:${userConfig.port}`
});


const MicroServices = {};

/**
 * HTTP request to microservices user for get user data
 * @param  {[int]} authId
 * @return {[obj]}
 */
MicroServices.getUserData = function(authId) {
    return await(axios.get(`/user/${authId}`)).data || {};
};



MicroServices.UserApi = class {
  constructor() {}


  /**
   * create auth user
   * @param  {[type]}
   * params {
             firstName: userData.firstName,
             lastName: userData.lastName,
             phone: userData.phone
    }
   * @return {[obj]}     { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
   */
  createAuthUser(params) {
    try {
      return await(axios.post('/user', params)).data || {};
    } catch (err) {
      throw logCriticalError_(err);
      return {};
    }
  }


  /**
   * update auth user
   * @param  {[type]} params
   * @return {[type]}  { id: 89, facebookId: null, vkId: null, okId: null, googleId: null, firstName: 'UPDATE', lastName: 'UPDATE1', gender: null, phone: '123131', email: 'rambler', password: null, photoUrl: null, status: 'active', birthDate: null, created_at: '2016-10-06', updated_at: '2016-10-06' }
   */
  updateAuthUser(params) {
    try {
      return await(axios.patch(`/user/${params.authId}`, {
          firstName: params.firstName || '',
          lastName:  params.lastName || '',
          email:     params.email || ''
      })).data || {};
    } catch (err) {
      throw logCriticalError_(err);
      return {};
    }
  }


  /**
   * get user data
   * @param  {[int]} authId
   * @return {[obj]}
   */
  getUserData(authId) {
    try {
      return await(axios.get(`/user/${authId}`)).data || {};
    } catch (err) {
      throw logCriticalError_(err);
      return {};
    }
  }


  /**
   * get users by params
   * @param  {[obj]} params: { email: 'test@example.ru', id: '1,2' }
   * @return {[obj]}
   */
  getUserByParams (params) {
    try {
      return await(axios.get('/users', { params })).data || [];
    } catch (err) {
      throw logCriticalError_(err);
      return [];
    }
  }
};

module.exports = MicroServices;


function logCriticalError_ (err) {
  if (typeof err === 'object') { err = util.inspect(err, { depth: 5 }); }
  return new errors.MicroServiceError(err);
}

// async(() => {
//   var UserApi = MicroServices.UserApi;
//   // var res = new user().getUserData(2111);
//   // var resp = new userApi().getUserByParams({
//   //   email: 'dm-kamaev@rambler.ru'
//   // });
//   var resp = new UserApi().getUserByParams({ id: '1,2' });
//   console.log(resp);
// })();