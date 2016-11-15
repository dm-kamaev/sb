'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
      return queryInterface.addColumn('SberUser', 'popUpAboutAddTopicDirection', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
      });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUser', 'popUpAboutAddTopicDirection');
    }
};