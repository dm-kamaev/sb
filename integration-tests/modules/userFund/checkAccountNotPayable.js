'use strict'

const services = require('../../services')

module.exports = function(context) {
  var chakram = context.chakram,
      db = context.db

    return function checkAcoountNotPayable() {
        return chakram.get(services.url('user'))
        .then(res => {
            var sberUser = res.body;

            return db.one(`
            SELECT FROM "SberUser"
            JOIN "UserFund"
                  ON "UserFund"."creatorId" = "SberUser".id
            JOIN "UserFundSubscription"
                  ON "SberUser"."id" = "UserFundSubscription"."sberUserId"
                  AND "UserFund".id = "UserFundSubscription"."userFundId"
            WHERE "SberUser".id = ${sberUser.id}
            AND "UserFund".enabled = false
            AND "UserFundSubscription".enabled = false`)
        })
    }
}
