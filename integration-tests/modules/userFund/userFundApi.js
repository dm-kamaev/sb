'use strict'

const config_db = require('../../config/db.json');
const util = require('util');
const db = require('pg-promise')()(config_db);
const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../../services');
const urlService = services.url;
const entityTypes = require('../../../app/modules/entity/enums/entityTypes.js');
const FUND      = entityTypes.FUND,
      DIRECTION = entityTypes.DIRECTION,
      TOPIC     = entityTypes.TOPIC;

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
     * @param {[array]} entities { id }
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
     * removeEntity from userFund
     * @param {[array]} entities { id }
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
     * removeEntities from userFund
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

    /**
     * not remove last entity from userFund !!! ONLY user auth and userFUnd enavled=true !!!
     * @param {[obj]} entities { id }
     */
    notRemoveLastEntity(entity) {
        var context = this.context;
        chakram.addMethod('checkNotRemoveLastEntity', function(respObj) {
            var response   = respObj.response || {},
                statusCode = response.statusCode,
                body       = response.body;
            // body [{ "message": "TRY_DELETE_USERFUND"}]
            this.assert(
                statusCode === 200 &&
                body instanceof Array &&
                body[0] instanceof Object &&
                body[0].message &&
                body[0].message === 'TRY_DELETE_USERFUND',
                'Error status '+statusCode+'; body:'+util.inspect(body, { depth: 5 })
            );
            return chakram.wait();
        });

        var responce = chakram.delete(urlService.addPath('user-fund/')+entity.id);
        return expect(responce).checkNotRemoveLastEntity();
    }


    /**
     * check added entities in userFund: comparison userFund from HTTP responce and entites from
     * association
     * @return {[type]} [description]
     */
    checkAddedEntities () {
        var context = this.context;
        chakram.addMethod('notExistEnityInUserFund', function(entity) {
            this.assert(
                false,
                'entity is not exist in userFund => entity: '+ util.inspect(entity, { depth: 5 })
            )
            return chakram.wait();
        });
        var associations;
        if (context.exist('associations')) {
            associations = context.get('associations');
        } else {
            associations = [context.get(FUND).id];
        }
        var hashId = {};
        associations.forEach(id => hashId[id] = true);
        var userFundEntityIds = context.get('responceEditUserFund').forEach(entity => {
            if (!hashId[entity.id]) {
                expect(entity).notExistEnityInUserFund();
            }
        });
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