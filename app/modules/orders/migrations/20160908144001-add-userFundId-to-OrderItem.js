'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('OrderItem', 'entityId', {
            type: Sequelize.INTEGER,
            allowNull: true
        })
          .then(() => {
              return queryInterface.addColumn('OrderItem', 'userFundId', {
                  type: Sequelize.INTEGER,
                  references: {
                      model: 'UserFund',
                      key: 'id'
                  }
              });
          })
          .then(() => {
              return queryInterface.changeColumn('OrderItem', 'uncovered', {
                  type: Sequelize.BOOLEAN,
                  defaultValue: true
              });
          });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('OrderItem', 'userFundId')
            .then(() => {
                return queryInterface.changeColumn('OrderItem', 'entityId', {
                    type: Sequelize.INTEGER,
                    allowNull: false
                });
            });
    }
};
