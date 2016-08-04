'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`ALTER TABLE "UserFund"
                  DROP CONSTRAINT "creatorId_foreign_idx";`);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`ALTER TABLE "UserFund"
        ADD FOREIGN KEY ("creatorId") REFERENCES "SberUser"(id)`);
    }
};
