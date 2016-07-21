'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('UPDATE "Entity" SET "imgUrl" = '+
        '(CASE LOWER(type) WHEN \'fund\' THEN \'entity_pics/defaultFund.png\' '+
        'WHEN \'topic\' THEN \'entity_pics/defaultTopic.png\' '+
        'WHEN \'direction\' THEN \'entity_pics/defaultDirection.png\' END);');
    },

    down: function(queryInterface, Sequelize) {

    }
};
