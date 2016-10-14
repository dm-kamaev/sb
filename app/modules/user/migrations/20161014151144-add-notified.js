'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('SberUser', 'notified', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
      })
      .then(() => {
          return queryInterface.addColumn('SberUser', 'categories', {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: 'all'
          })
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('SberUser', 'notified')
      .then(() => {
          return queryInterface.removeColumn('SberUser', 'categories')
      })
  }
};
