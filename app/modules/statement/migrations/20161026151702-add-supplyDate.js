'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('StatementOrder', 'supplyDate', {
            type: Sequelize.DATEONLY
      })
      .then(() => {
          return queryInterface.sequelize.query(`UPDATE "StatementOrder" SET "supplyDate" = CURRENT_DATE`)
      })
      .then(() => {
          return queryInterface.changeColumn('StatementOrder', 'supplyDate', {
              type: Sequelize.DATEONLY,
              allowNull: false
          })
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('StatementOrder', 'supplyDate')
  }
};
