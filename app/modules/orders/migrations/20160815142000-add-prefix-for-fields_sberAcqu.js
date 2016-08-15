'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`
          ALTER TABLE "Order" RENAME COLUMN "orderNumber"           TO "sberAcquOrderNumber";
          ALTER TABLE "Order" RENAME COLUMN "orderId"               TO "sberAcquOrderId";
          ALTER TABLE "Order" RENAME COLUMN "errorCode"             TO "sberAcquErrorCode";
          ALTER TABLE "Order" RENAME COLUMN "errorMessage"          TO "sberAcquErrorMessage";
          ALTER TABLE "Order" RENAME COLUMN "actionCode"            TO "sberAcquActionCode";
          ALTER TABLE "Order" RENAME COLUMN "actionCodeDescription" TO "sberAcquActionCodeDescription";
        `);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`
          ALTER TABLE "Order" RENAME COLUMN "sberAcquOrderNumber"           TO "orderNumber";
          ALTER TABLE "Order" RENAME COLUMN "sberAcquOrderId"               TO "orderId";
          ALTER TABLE "Order" RENAME COLUMN "sberAcquErrorCode"             TO "errorCode";
          ALTER TABLE "Order" RENAME COLUMN "sberAcquErrorMessage"          TO "errorMessage";
          ALTER TABLE "Order" RENAME COLUMN "sberAcquActionCode"            TO "actionCode";
          ALTER TABLE "Order" RENAME COLUMN "sberAcquActionCodeDescription" TO "actionCodeDescription";
        `);
    }
};
