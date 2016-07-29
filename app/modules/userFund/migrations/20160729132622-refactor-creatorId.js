'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('UserFund', 'creatorId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            allowNull: true,
            unique: true
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('UserFund', 'creatorId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'SberUser',
                key: 'id'
            },
            allowNull: false,
            unique: true
        });
    }
};
