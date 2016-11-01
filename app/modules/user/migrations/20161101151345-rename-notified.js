'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      return queryInterface.renameColumn('SberUser', 'notified', 'draftNotified')
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.renameColumn('SberUser', 'draftNotified', 'notified')
  }
};
