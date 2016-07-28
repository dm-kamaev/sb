'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('Entity', 'imgUrl', {
            type: Sequelize.STRING
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('Entity', 'imgUrl');
    }
};
