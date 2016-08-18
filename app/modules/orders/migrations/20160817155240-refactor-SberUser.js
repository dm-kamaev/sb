'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('SberUser', 'payDay', {
          type: Sequelize.INTEGER
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('SberUser', 'payDay')
  }
};
