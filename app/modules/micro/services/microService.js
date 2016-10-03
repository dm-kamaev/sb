'use strict';

// methods for work with microservice
// author: dmitrii kamaev

const config = require('../../../../config/config.json');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const errors = require('../../../components/errors');
const logger = require('../../../components/logger').getLogger('main');

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
module.exports = MicroServices;
