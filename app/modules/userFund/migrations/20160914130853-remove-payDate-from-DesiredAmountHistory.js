'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('DesiredAmountHistory', 'payDate');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('DesiredAmountHistory', 'payDate', {
            type: Sequelize.DATE,
            allowNull: false
        });
    }
};
