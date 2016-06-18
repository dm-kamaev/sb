'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('entities_assosciations', {
      found_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'entity',
          key: 'id'
        }
      },
      trend_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'entity',
          key: 'id'
        }
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('entities_assosciations')
  }
};
