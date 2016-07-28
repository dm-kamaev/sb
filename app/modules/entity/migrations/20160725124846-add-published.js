'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Entity', 'published', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Entity', 'published');
    }
};
