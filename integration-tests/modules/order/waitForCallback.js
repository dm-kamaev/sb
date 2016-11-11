'use strict'

const orderStatus = require('../../../app/modules/orders/enums/orderStatus')

module.exports = function(context) {
    var db = context.db;

    return function checkCb() {
      var deferred = Promise.defer()

      db.one('SELECT * FROM "Order" WHERE "sberAcquOrderId" = ${sberOrderId}', context)
      .then(order => {
          Object.assign(context, order)

          if (order.status == orderStatus.WAITING_FOR_PAY
           || order.status == orderStatus.CONFIRMING_PAYMENT) {
            setTimeout(() => {
              checkCb().then(deferred.resolve)
            }, 500)
          } else {
            deferred.resolve()
          }
      })

      return deferred.promise
    }
}
