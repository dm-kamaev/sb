'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('Statement', 'recommendation', {
          type: Sequelize.STRING
      })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Statement', 'recommendation')
  }
};
