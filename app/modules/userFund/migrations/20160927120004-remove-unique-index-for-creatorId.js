'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize
               .query('ALTER TABLE "UserFund" DROP CONSTRAINT "UserFund_creatorId_key"');
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize
              .query('ALTER TABLE "UserFund" ADD CONSTRAINT "UserFund_creatorId_key" UNIQUE ("creatorId")');
    }
};

