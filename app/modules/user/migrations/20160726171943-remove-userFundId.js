'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUser', 'userFundId');
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('SberUser', 'userFundId', {
            allowNull: true,
            references: {
                model: 'UserFund',
                key: 'id'
            },
            type: Sequelize.INTEGER
        });
    }
};
