'use strict'

const chakram = require('chakram');
const expect = chakram.expect;
const execSync = require('child_process').execSync;
const path = require('path');
const queryString = require('query-string');
const services = require('../services');

const pgp = require('pg-promise')();
const connection = {
    host: 'localhost',
    port: 5432,
    database: 'sber-together-api',
    user: 'gorod',
    password: '123qwe'
}
const db = pgp(connection)

chakram.setRequestDefaults({
    jar: true
});

describe('Admin operations', function() {
    const adminOptions = {
        headers: {
            'Token-Header': 'superSecretTokenString'
        }
    }

    before('Register user', function() {
        var user = services.user.genRandomUser(),
            resp = chakram.post(services.url('auth/register'), user)
        this.email = user.email;
        this.firstName = user.firstName
        this.lastName = user.lastName
        expect(resp).to.have.status(200)
        return resp.then(() => {
            return chakram.get(services.url('user'))
        })
        .then(res => {
            this.sberUserId = res.body.id
            this.userFundId = res.body.userFund.id
            return chakram.wait()
        })
    });

    before('create entities if not exists', function () {
        var entities = services.entity.generateEntities(1);
        return chakram.get(services.url('entity'))
        .then(res => {
            if (!res.body[0]) {
                return chakram.post(services.url('entity'), entities[0], adminOptions)
            }
            var entity = res.body[0];
            expect(entity).to.be.a('object');
            expect(entity.type).to.be.oneOf(['direction', 'fund', 'topic']);
            this.entityId = entity.id;
        })
        .then(entity => {
            if (this.entityId) return chakram.wait();
            expect(entity).to.be.a('object');
            expect(entity.type).to.be.oneOf(['direction', 'fund', 'topic']);
            this.entityId = entity.id
            return chakram.wait();
        })
    });

    before('add entity to userFund', function() {
        var response = chakram.post(services.url(`user-fund/${this.entityId}`))
        expect(response).to.have.status(200)
        return chakram.wait()
    });

    before('set amount', function() {
        this.amount = 55500
        var response = chakram.post(services.url('user-fund/amount'), {
            amount: this.amount
        })
        expect(response).to.have.status(200)
        return response.then(res => {
            this.formUrl = res.body.formUrl;
            return chakram.wait()
        })
    })

    before('first payment', function() {
        var eqResp = chakram.get(this.formUrl)
        expect(eqResp).to.have.status(200)
        return eqResp.then(res => {
            expect(res.body.message).to.be.equal('Success')
            expect(res.body.code).to.be.equal(0)
            return chakram.wait()
        })
    })

    before('logout', function() {
        return chakram.post(services.url('auth/logout'))
        .then(() => {
            return chakram.get(services.url('user'))
        })
        .then(res => {
            expect(res.body).to.be.a('undefined')
            return chakram.wait()
        })
    })

    it('Should get order', function() {
        return chakram.get(services.url(`user/${this.sberUserId}/order`), adminOptions)
            .then(res => {
                var order = res.body[0];
                expect(order.amount).to.be.equal(this.amount)
                expect(order.userFundId).to.be.equal(this.userFundId)
                this.sberAcquOrderNumber = order.sberAcquOrderNumber
                return chakram.wait()
            })
    })

    it('Should get order entities', function() {
        return chakram.get(services.url(`order/${this.sberAcquOrderNumber}/entity`), adminOptions)
        .then(res => {
            var entities = res.body;
            expect(entities.length).to.be.equal(1)
            expect(entities[0].id).to.be.equal(this.entityId)
            return chakram.wait()
        })
    })

    it('Should get user in global list', function() {
        return chakram.get(services.url('user/all'), adminOptions)
        .then(res => {
            var user = res.body.find(user => user.id == this.sberUserId)
            expect(user).to.be.a('object')
            expect(user.email).to.be.equal(this.email)
            return chakram.wait()
        })
    })

    it('Should get user profile', function() {
        return chakram.get(services.url(`user/${this.sberUserId}`), adminOptions)
        .then(res => {
            var user = res.body;
            expect(user.id).to.be.equal(this.sberUserId)
            expect(user.email).to.be.equal(this.email)
            expect(user.userFund.id).to.be.equal(this.userFundId)
            return chakram.wait()
        })
    })

    it('Should update user', function() {
        var changedName = 'NEW_NAME'
        return chakram.put(services.url(`user/${this.sberUserId}`), {
            firstName: changedName,
            lastName: this.lastName,
	    email: this.email
        }, adminOptions)
        .then(res => {
            var user = res.body;
            expect(user.id).to.be.equal(this.sberUserId)
            expect(user.firstName).to.be.equal(changedName)
            expect(user.lastName).to.be.equal(this.lastName)
            return chakram.wait()
        })
    })

    it('Should get user subscriptions', function() {
        return chakram.get(services.url(`user/${this.sberUserId}/subscription`), adminOptions)
        .then(res => {
            var subscription = res.body.find(sub => sub.userFundId == this.userFundId)
            expect(subscription).to.be.a('object')
            expect(subscription.sberUserId).to.be.equal(this.sberUserId)
            expect(subscription.amount).to.be.equal(this.amount)
            this.subscriptionId = subscription.id
            return chakram.wait()
        })
    })

    it('Should set amount on subscription', function() {
        var newAmount = 91100
        return chakram.post(services.url(`user/${this.sberUserId}/subscription/${this.subscriptionId}/amount`), {
            amount: newAmount
        }, adminOptions)
        .then(() => {
            return chakram.get(services.url(`user/${this.sberUserId}/subscription`), adminOptions)
        })
        .then(res => {
            var subscription = res.body.find(sub => sub.id == this.subscriptionId)
            expect(subscription.userFundId).to.be.equal(this.userFundId)
            expect(subscription.amount).to.be.equal(newAmount)
            return chakram.wait()
        })
    })
})
