'use strict'

const services = require('../../services')

module.exports = function (context) {
    var chakram = context.chakram,
        db = context.db
    return function checkPaidRecurrent() {
        return chakram.get(services.url('user'))
        .then(res => {
            var sberUserId = res.body.id,
                userFundId = res.body.userFund.id;
            //db.one waits for only one result from database
            return db.one(`SELECT "UserFundSubscription"."id",
      "UserFundSubscription"."userFundId",
      "UserFundSubscription"."sberUserId"
      FROM "UserFundSubscription"
      INNER JOIN "UserFund" ON "UserFund".id = "UserFundSubscription"."userFundId"
      AND "UserFund"."enabled" = true
      INNER JOIN "Order" ON "Order"."userFundSubscriptionId" = "UserFundSubscription"."id"
      AND "Order"."type" = \'recurrent\' AND "Order"."status" = \'paid\'
      WHERE "UserFundSubscription"."sberUserId" = ${sberUserId}
      AND "userFundId" = ${userFundId} AND "UserFundSubscription"."enabled" = true`);
    });
    }
}
