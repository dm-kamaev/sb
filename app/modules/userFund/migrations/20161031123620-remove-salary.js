'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DesiredAmountHistory', 'salary')
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.addColumn('DesiredAmountHistory', 'salary', {
        type: Sequelize.INTEGER,
        defaultValue: null,
    });
  }
};
