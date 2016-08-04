'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('SberUser', 'currentCardId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'Card',
                key: 'id'
            }
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUser', 'currentCardId');
    }
};
