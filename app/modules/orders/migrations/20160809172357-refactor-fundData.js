'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`ALTER TABLE "Order"
                                          ALTER COLUMN "fundInfo"
                                          TYPE jsonb
                                          USING "fundInfo"::jsonb`);
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query(`ALTER TABLE "Order"
                                          ALTER COLUMN "fundInfo"
                                          TYPE json
                                          USING "fundInfo"::json`);
    }
};
