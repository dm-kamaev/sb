'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Order', 'scheduledPayDate', {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        })
      .then(() => {
          return queryInterface.sequelize.query('UPDATE "Order" SET "scheduledPayDate" = "createdAt"');
      })
      .then(() => {
          return queryInterface.changeColumn('Order', 'scheduledPayDate', {
              type: Sequelize.DATE,
              defaultValue: Sequelize.NOW,
              allowNull: false
          });
      });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Order', 'scheduledPayDate');
    }
};
