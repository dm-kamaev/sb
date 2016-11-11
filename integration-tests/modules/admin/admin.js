'use strict'

const services = require('../../services')

exports.getOrders = function(context) {
    var db = context.db,
        adminOptions = context.adminOptions,
        chakram = context.chakram,
        expect = context.expect

    return function(){
      return chakram.get(services.url(`user/${context.user.id}/order`), adminOptions)
          .then(res => {
              var order = res.body[0];
              expect(order.amount).to.be.equal(context.amount)
              expect(order.userFundId).to.be.equal(context.user.userFund.id)
              context.sberAcquOrderNumber = order.sberAcquOrderNumber
          })
    }
}

exports.getOrderEntities = function(context) {
  var db = context.db,
      adminOptions = context.adminOptions,
      chakram = context.chakram,
      expect = context.expect


    return function() {
      return chakram.get(services.url(`order/${context.sberAcquOrderNumber}/entity`), adminOptions)
          .then(res => {
              var entities = res.body;
              expect(entities.length).to.be.equal(1)
              expect(entities.some(e => {
                return context.listEntities.some(z => z.id == e.id)
              })).to.be.true
              return chakram.wait()
          })
    }
}

exports.getUserList = function(context) {
    var db = context.db,
        adminOptions = context.adminOptions,
        chakram = context.chakram,
        expect = context.expect

    return function() {
        return chakram.get(services.url('user/all'), adminOptions)
            .then(res => {
                var user = res.body.find(user => user.id == context.user.id)
                expect(user).to.be.a('object')
                expect(user.email).to.be.equal(context.user.email)
                return chakram.wait()
            })
    }
}

exports.getUserProfile = function(context) {
  var db = context.db,
      adminOptions = context.adminOptions,
      chakram = context.chakram,
      expect = context.expect

    return function() {
        return chakram.get(services.url(`user/${context.user.id}`), adminOptions)
            .then(res => {
                var user = res.body;
                expect(user.id).to.be.equal(context.user.id)
                expect(user.email).to.be.equal(context.user.email)
                expect(user.userFund.id).to.be.equal(context.user.userFund.id)
                return chakram.wait()
            })
    }
}

exports.updateUser = function(context) {
    var db = context.db,
        adminOptions = context.adminOptions,
        chakram = context.chakram,
        expect = context.expect


    return function() {
        var changedName = 'NEW_NAME'
        return chakram.put(services.url(`user/${context.user.id}`), {
                firstName: changedName,
                lastName: context.user.lastName
            }, adminOptions)
            .then(res => {
                var user = res.body;
                expect(user.id).to.be.equal(context.user.id)
                expect(user.firstName).to.be.equal(changedName)
                expect(user.lastName).to.be.equal(context.user.lastName)
                return chakram.wait()
            })
    }
}

exports.getUserSubscriptions = function(context) {
  var db = context.db,
      adminOptions = context.adminOptions,
      chakram = context.chakram,
      expect = context.expect

    return function() {
        return chakram.get(services.url(`user/${context.user.id}/subscription`), adminOptions)
              .then(res => {
                  var subscription = res.body.find(sub => {
                      return sub.userFundId == context.user.userFund.id
                  })
                  expect(subscription).to.be.a('object')
                  expect(subscription.sberUserId).to.be.equal(context.user.id)
                  expect(subscription.amount).to.be.equal(context.amount)
                  context.subscriptionId = subscription.id
                  return chakram.wait()
              })
    }
}

exports.setSubscriptionAmount = function(context) {
    var db = context.db,
        adminOptions = context.adminOptions,
        chakram = context.chakram,
        expect = context.expect

    return function() {
        var newAmount = 91100
        return chakram.post(services.url(`user/${context.user.id}/subscription/${context.subscriptionId}/amount`), {
                amount: newAmount
            }, adminOptions)
            .then(() => {
                return chakram.get(services.url(`user/${context.user.id}/subscription`), adminOptions)
            })
            .then(res => {
                var subscription = res.body.find(sub => sub.id == context.subscriptionId)
                expect(subscription.userFundId).to.be.equal(context.user.userFund.id)
                expect(subscription.amount).to.be.equal(newAmount)
                return chakram.wait()
            })
    }
}
