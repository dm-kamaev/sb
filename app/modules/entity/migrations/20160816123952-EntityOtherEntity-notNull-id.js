'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.sequelize.query(`DELETE FROM "EntityOtherEntity"
          WHERE "entityId" IS null OR "otherEntityId" IS null`)
          .then(() => {
              return queryInterface.changeColumn('EntityOtherEntity', 'entityId', {
                  type: Sequelize.INTEGER,
                  allowNull: false
              })
          })
          .then(() => {
              return queryInterface.changeColumn('EntityOtherEntity', 'otherEntityId', {
                  type: Sequelize.INTEGER,
                  allowNull: false
              })
          })

  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.changeColumn('EntityOtherEntity', 'entityId', {
          type: Sequelize.INTEGER,
          allowNull: true
      })
      .then(() => {
          return queryInterface.changeColumn('EntityOtherEntity', 'otherEntityId', {
              type: Sequelize.INTEGER,
              allowNull: false
          })
      })
  }
};
