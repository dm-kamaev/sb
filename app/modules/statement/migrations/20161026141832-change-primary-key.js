'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.sequelize.query(`
        ALTER TABLE "StatementOrder" DROP CONSTRAINT IF EXISTS "StatementItem_pkey"`)
        .then(() => {
            return queryInterface.sequelize.query(`ALTER TABLE "StatementOrder" DROP CONSTRAINT IF EXISTS "StatementOrder_pkey"`)
        })
        .then(() => {
          return queryInterface.sequelize.query(`ALTER TABLE "StatementOrder" ADD PRIMARY KEY ("id")`)
        })

  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.sequelize.query(`
        ALTER TABLE "StatementOrder" DROP CONSTRAINT "StatementOrder_pkey"`)
        .then(() => {
            return queryInterface.sequelize.query(`ALTER TABLE "StatementOrder" ADD PRIMARY KEY ("sberAcquOrderNumber")`)
        })
  }
};
