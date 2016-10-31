'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DesiredAmountHistory', 'percent')
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('DesiredAmountHistory', 'percent', {
        type: Sequelize.INTEGER,
        defaultValue: null,
    });
  }
};
