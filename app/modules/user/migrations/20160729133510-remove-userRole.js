'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUser', 'role');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('SberUser', 'role', {
            type: Sequelize.STRING,
            defaultValue: 'user'
        });
    }
};
