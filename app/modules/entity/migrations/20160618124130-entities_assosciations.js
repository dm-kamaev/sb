'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('entityId_otherEntityId', {
      id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'entity',
          key: 'id'
        }
      },
      otherEntity_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'entity',
          key: 'id'
        }
      },
      createdAt: {
          type: Sequelize.DATE
      },
      updatedAt: {
          type: Sequelize.DATE
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('entityId_otherEntityId')
  }
};
