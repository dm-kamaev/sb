'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('SberUser', 'paymentNotified', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
      })
      .then(() => {
          return queryInterface.sequelize.query(`UPDATE "SberUser" SET "paymentNotified" = false`)
      })
      .then(() => {
        return queryInterface.changeColumn('SberUser', 'paymentNotified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        })
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('SberUser', 'paymentNotified')
  }
};
