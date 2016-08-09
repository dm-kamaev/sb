'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('Orders', 'Order');
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('Orders', 'Order');
  }
};
