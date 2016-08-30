'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('Order', 'status', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'new'
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('Order', 'status', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null
        });
    }
};
