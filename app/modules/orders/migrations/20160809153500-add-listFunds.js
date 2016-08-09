'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      queryInterface.addColumn('Order', 'listFunds', {
          type: Sequelize.ARRAY(Sequelize.STRING),
      })
  },

  down: function (queryInterface, Sequelize) {
      queryInterface.removeColumn('Order', 'listFunds');
  }
};
