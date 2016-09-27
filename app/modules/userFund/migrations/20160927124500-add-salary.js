'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('DesiredAmountHistory', 'salary', {
            type: Sequelize.INTEGER,
            defaultValue: null,
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('DesiredAmountHistory', 'salary');
    }
};

