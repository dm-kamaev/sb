'use strict'

const chakram = require('chakram');
const expect = chakram.expect;

var extend = require('util')._extend;


const services = require('../services');

chakram.setRequestDefaults({
    jar: true
});

describe('User fund Actions Test', function() {
    var entitiesIdList = [];

    before('Add methods', function() {
        chakram.addMethod('entitiesAdded', function(respObj) {
            var self = this;
            var entities = respObj.body;

            var entityIds = entities.map((entity) => entity.id);
            entitiesIdList.forEach(function (id) {
                self.assert(
                    !(id in entityIds),
                    'Entity with id '+ id + ' is not added'
                )
            });
        });
        chakram.addMethod('saveAddedEntity', function(respObj) {
            this.assert(
                respObj.body.id,
                'Can\'t run test, entity not added'
            )
            entitiesIdList.push(respObj.body.id);
        });
        chakram.addMethod('entitiesDeleted', function(respObj) {
            var self = this;
            var entities = respObj.body;
            var entityIds = entities.map((entity) => entity.id);
            entitiesIdList.forEach(function (id) {
                self.assert(
                    !(id in entityIds),
                    'Entity with id ' + id + ' is not deleted'
                )
            });
        });
    });

    before('Load entities', function() {
        var entities = services.entity.generateEntities(3);
        var url = services.url.concatUrl('entity');
        entities.forEach(function(entity) {
            var ent = chakram.post(url, entity);
            expect(ent).saveAddedEntity();
        });
        return chakram.wait();
    });

    it('Should add entities', function() {
        entitiesIdList.forEach(function (entityId) {
            var url = services.url.concatUrl('user-fund/'+entityId);
            var res = chakram.post(url);
            expect(res).to.have.status(200);
            chakram.wait();
        });
        return chakram.wait();
    });

    it('Should get added entities', function () {
        var url = services.url.concatUrl('user-fund/entity');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).entitiesAdded();
        return chakram.wait();
    });

    it('Should delete entities', function () {
        entitiesIdList.forEach(function (entityId) {
            var url = services.url.concatUrl('user-fund/'+entityId);
            var res = chakram.delete(url);
            expect(res).to.have.status(200);
        });
        return chakram.wait();
    });

    it('Should not get deleted entities', function () {
        var url = services.url.concatUrl('user-fund/entity');
        var response = chakram.get(url);
        expect(response).to.have.status(200);
        expect(response).entitiesDeleted();
        return chakram.wait();
    });
});
