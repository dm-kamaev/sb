'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Order', 'funds')
      .then(() => {
          return queryInterface.removeColumn('Order', 'fundInfo');
      })
      .then(() => {
          return queryInterface.removeColumn('Order', 'directionsTopicsFunds');
      });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Order', 'directionsTopicsFunds', {
            type: Sequelize.ARRAY(Sequelize.STRING)
        })
      .then(() => {
          return queryInterface.addColumn('Order', 'fundInfo', {
              type: DataTypes.JSONB,
          });
      })
      .then(() => {
          return queryInterface.addColumn('Order', 'funds', {
              type: Sequelize.ARRAY(Sequelize.STRING)
          });
      });
    }
};
