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

const CHECK_STATUS_PATH = path.join(__dirname, '../../app/scripts/checkOrderStatus.js')
const db = pgp(connection)

var extend = require('util')._extend;

const logout = require('../modules/user/logout.js');
const register = require('../modules/user/register.js');
const getUserInfo = require('../modules/user/getUserInfo.js');
const createEntities = require('../modules/entity/createEntities.js');
const addEntity = require('../modules/entity/addEntity.js');
const firstPay = require('../modules/userFund/firstPay.js');
const userFund = require('../modules/userFund/userFund.js');
const checkCb = require('../modules/order/waitForCallback')
const payOrder = require('../modules/order/payOrder')
const admin = require('../modules/admin/admin')
const runCron = require('../modules/order/runCron')
const checkPaidRecurrent = require('../modules/order/checkPaidRecurrent')
const checkAccountNotPayable = require('../modules/userFund/checkAccountNotPayable')
const setBindings = require('../lib/setBindingsResult')

chakram.setRequestDefaults({
    jar: true,
    har: {
        headers: [{
            name: 'Token-Header',
            value: 'superSecretTokenString'
        }]
    }
});
describe('Recurrent payments => ', function() {
  var context = {
         chakram,
         expect,
         listEntities: [],
         db,
         // adminOptions
     }

    before(setBindings.bind(null, true))
    after(setBindings.bind(null, true))
    after(pgp.end)

    describe('Same day test', function() {
        var nextMonth = new Date();

        nextMonth.setMonth(new Date().getMonth() + 1)
        nextMonth = nextMonth.toISOString().substring(0, 10)

        recurrentFlow_(context, [runCron(context, nextMonth)], {
            afterChecks: [checkPaidRecurrent(context)]
        })
    })

    describe('Next day test', function() {
        var nextMonth = new Date(),
            now = new Date();

        nextMonth.setMonth(now.getMonth() + 1)
        nextMonth.setDate(now.getDate() + 1)
        nextMonth = nextMonth.toISOString().substring(0, 10)

        recurrentFlow_(context, [runCron(context, nextMonth)], {
            afterChecks: [checkPaidRecurrent(context)]
        })
    })

    describe('Disable account after two fails', function() {
        var nextMonth = new Date(),
            nextAfterNextMonth = new Date(),
            now = new Date();

        nextMonth.setMonth(now.getMonth() + 1)
        nextAfterNextMonth.setMonth(now.getMonth() + 2)
        nextMonth = nextMonth.toISOString().substring(0, 10)
        nextAfterNextMonth = nextAfterNextMonth.toISOString().substring(0, 10)

        var hooks = {
          preCron: [setBindings.bind(null, false)],
          afterChecks: [checkAccountNotPayable(context),
                        setBindings.bind(null, true)]
        }

        recurrentFlow_(context, [runCron(context, nextMonth),
                                 runCron(context, nextAfterNextMonth)], hooks)
    })

    describe('Continuie donations after one failure', function() {
      var nextMonth = new Date(),
          nextAfterNextMonth = new Date(),
          now = new Date();

      nextMonth.setMonth(now.getMonth() + 1)
      nextAfterNextMonth.setMonth(now.getMonth() + 2)
      nextMonth = nextMonth.toISOString().substring(0, 10)
      nextAfterNextMonth = nextAfterNextMonth.toISOString().substring(0, 10)

      function callCron(isSuccess, month) {
          setBindings(false)
          .then(() => {
              return runCron(context, nextMonth)()
          })
          .then(() => {
              return setBindings(true)
          })
          .then(() => {
              return runCron(context, nextAfterNextMonth)()
          })
      }

      var hooks = {
          afterChecks: [checkPaidRecurrent(context),
                        setBindings.bind(null, true)]
      }

      recurrentFlow_(context, [callCron], hooks)
    })
})

function recurrentFlow_(context, crons, hooks) {
    var afterChecks = hooks.afterChecks,
        preCron = hooks.preCron
    before('create entities if not exists', createEntities(context));
    before('Logout', logout(context));
    before('Register user', register(context));

    it('add entity to userFund', addEntity(context));
    it('get user info', getUserInfo(context))
    it('set amount', firstPay.withOutCheck(context));
    it('pay order', payOrder(context))
    it('wait for cb', checkCb(context))

    preCron && preCron.forEach(pre => it(pre.name || 'unnamed hook', pre))

    it('should run cron', function() {
      crons.forEach(cron => cron())
    })

    afterChecks && afterChecks.forEach(check => {
      it(check.name || 'unnamed after check', check)
    })

    after('Logout', logout(context));
}
