'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('StatementOrder', 'id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('StatementOrder', 'id')
  }
};
