'use strict'

const config_db = require('../../config/db.json');
const util = require('util');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const urlService = services.url;


module.exports = class UserFundApi {
    /**
     * [constructor description]
     * @param  {[obj]} context
     * @return {[type]}         [description]
     */
    constructor(context) {
        this.context = context;
    }

    /**
     * addEntity to userFund
     * @param {[array]} entities [ { id }, { id }]
     */
    addEntities(entities) {
        var context = this.context;
        chakram.addMethod('checkAddEntity', function(respObj, enabled) {
            var response = respObj.response || {},
                statusCode = response.statusCode,
                body       = response.body;
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth: 5 })
            );
            save_userFund_(context, body);
            return chakram.wait();
        });

        var url = urlService.addPath('user-fund/');
        var promises = entities.map(entity => {
            return chakram.post(url+entity.id)
        });
        return Promise.all(promises).then(responces =>
            responces.forEach(responce => expect(responce).checkAddEntity(entities))
        );
    }


    /**
     * addEntity to userFund
     * @param {[array]} entities [ { id }, { id }]
     */
    addEntity(entity) {
        var context = this.context;
        chakram.addMethod('checkAddEntity', function(respObj) {
            var response   = respObj.response || {},
                statusCode = response.statusCode,
                body       = response.body;
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth: 5 })
            );
            save_userFund_(context, body);
            return chakram.wait();
        });

        var responce = chakram.post(urlService.addPath('user-fund/')+entity.id);
        return expect(responce).checkAddEntity();
    }

    /**
     * addEntity to userFund
     * @param {[array]} entities [ { id }, { id }]
     */
    removeEntity(entity) {
        var context = this.context;
        chakram.addMethod('checkRemoveEntity', function(respObj) {
            var response   = respObj.response || {},
                statusCode = response.statusCode,
                body       = response.body;
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth: 5 })
            );
            save_userFund_(context, body);
            return chakram.wait();
        });

        var responce = chakram.delete(urlService.addPath('user-fund/')+entity.id);
        return expect(responce).checkRemoveEntity();
    }

    /**
     * removeEntity from userFund
     * @param {[array]} entities [ { id }, { id }]
     */
    removeEntities(entities) {
        var context = this.context;
        chakram.addMethod('checkRemoveEntity', function(respObj, enabled) {
            var response = respObj.response || {};
            var statusCode = response.statusCode,
                body = response.body;
            this.assert(
                statusCode === 200,
                'Error status ' + statusCode + '; body:' + util.inspect(body, { depth: 5 })
            );
            save_userFund_(context, body);
            return chakram.wait();
        });

        var url = urlService.addPath('/user-fund/');
        var promises = entities.map(entity => chakram.delete(url+entity.id));
        return Promise.all(promises).then(responces =>
            responces.forEach(responce => expect(responce).checkRemoveEntity(entities))
        );
    }

}


function save_userFund_ (context, body) {
    var key = 'responceEditUserFund';
    if (context.exist(key)) {
        context.change(key, body);
    } else {
        context.set(key, body);
    }
}