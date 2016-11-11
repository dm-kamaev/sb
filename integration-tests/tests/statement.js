'use strict';

const chakram = require('chakram');
const expect = chakram.expect;
const services = require('../services');
const config_db = require('../config/db.json');
const config_admin = require('../config/admin.json');
const db = require('pg-promise')()(config_db);
const util = require('util');
const orderStatus = require('../../app/modules/orders/enums/orderStatus')

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntities.js');
const addEntity   = require('../modules/entity/addEntity.js');
const firstPay    = require('../modules/userFund/firstPay.js');
const userFund    = require('../modules/userFund/userFund.js');
const statement = require('../modules/statement/statement')
const checkCb = require('../modules/order/waitForCallback')
const payOrder = require('../modules/order/payOrder')

chakram.setRequestDefaults(config_admin);

describe('Statement =>', function() {
  var context = {
      chakram,
      expect,
      listEntities: [],
      dateStart: new Date(new Date().setDate(new Date().getDate() -1)),
      dateEnd: new Date(),
      db
  };


  before('Logout',   logout(context));
  before('Register', register(context));
  before('Create entities if not exists', createEntities(context));

  it('Add enity to userFund',           addEntity(context));
  it('Get user info',                   getUserInfo(context));
  it('set amount', firstPay.withOutCheck(context));
  it('pay order', payOrder(context))

  it('wait for cb', checkCb(context))
  it('should upload statement',         statement.upload(context))
  it('waits for handling statement', function checkStatement() {
      var deferred = Promise.defer()
      setTimeout(deferred.reject, 10000)

      db.one("SELECT FROM \"StatementOrder\" WHERE \"sberAcquOrderNumber\" = ${sberAcquOrderNumber}", context)
      .then(deferred.resolve)
      .catch(err => {
          setTimeout(() => {
            checkStatement()
            .then(deferred.resolve)
          }, 500)
      })

      return deferred.promise;
  })
  it('should have statement and statementOrders', function() {
      return db.one('SELECT * FROM "StatementOrder" WHERE "sberAcquOrderNumber" = ${sberAcquOrderNumber}', context)
      .then(statementOrder => {
          context.statementId = statementOrder.statementId;

          return db.one('SELECT FROM "Statement" WHERE "id" = ${statementId}', context)
      })
  })
})
