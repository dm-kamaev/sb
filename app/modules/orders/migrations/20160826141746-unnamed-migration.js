'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.addColumn('OrderItem', 'parentId', {
          type: Sequelize.INTEGER,
          references: {
              model: 'OrderItem',
              key: 'id'
          }
      })
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.dropColumn('OrderItem', 'parentId')
  }
};
