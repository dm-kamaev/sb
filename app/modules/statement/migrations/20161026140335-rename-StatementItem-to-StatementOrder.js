'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('StatementItem', 'StatementOrder')
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.renameTable('StatementItem', 'StatementOrder');
  }
};
