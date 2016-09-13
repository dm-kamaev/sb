'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.addColumn('Card', 'PAN', {
            type: Sequelize.STRING
        })
            .then(() => {
                return queryInterface.addColumn('Card', 'cardHolderName', {
                    type: Sequelize.STRING
                })
            })
            .then(() => {
                return queryInterface.addColumn('Card', 'expiration', {
                    type: Sequelize.DATEONLY
                })
            })
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.removeColumn('Card', 'cardHolderName')
            .then(() => {
                return queryInterface.removeColumn('Card', 'PAN')
            })
            .then(() => {
                return queryInterface.removeColumn('Card', 'expiration')
            })
    }
};
