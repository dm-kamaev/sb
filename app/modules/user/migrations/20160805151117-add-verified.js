'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('SberUser', 'verified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        })
        .then(() => {
            return queryInterface.sequelize.query(`UPDATE "SberUser"
            SET verified='false' WHERE verified=null`);
        })
        .then(() => {
            return queryInterface.changeColumn('SberUser', 'verified', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUser', 'verified');
    }
};
