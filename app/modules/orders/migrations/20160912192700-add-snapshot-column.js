'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('Order', 'userFundSnapshot', {
          type: Sequelize.JSONB,
          allowNull: true
      })
  },

  down: function (queryInterface, Sequelize) {
        return queryInterface.removeColumn('OrderItem', 'userFundSnapshot')
  }
};
