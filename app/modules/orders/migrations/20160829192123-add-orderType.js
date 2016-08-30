'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Order', 'type', {
            type: Sequelize.STRING,
            defaultValue: 'first'
        })
      .then(() => {
          return queryInterface.sequelize.query('UPDATE "Order" SET "type" = \'first\'');
      })
      .then(() => {
          return queryInterface.changeColumn('Order', 'type', {
              type: Sequelize.STRING,
              defaultValue: 'first',
              allowNull: false
          });
      });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Order', 'type');
    }
};
