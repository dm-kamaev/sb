'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('Statement', 'status', {
          type: Sequelize.STRING
      })
      .then(() => {
          return queryInterface.sequelize.query(`UPDATE "Statement" SET "status" = 'ready'`)
      })
      .then(() => {
          return queryInterface.changeColumn('Statement', 'status', {
              type: Sequelize.STRING,
              allowNull: false
          })
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('Statement', 'status')
  }
};
