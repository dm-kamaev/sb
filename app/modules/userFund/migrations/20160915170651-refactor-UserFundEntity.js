'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('DELETE FROM "UserFundEntity" WHERE "entityId" IS null OR "userFundId" IS null')
        .then(() => {
            queryInterface.changeColumn('UserFundEntity', 'entityId', {
                type: Sequelize.INTEGER,
                allowNull: false
            });
        })
        .then(() => {
            return queryInterface.changeColumn('UserFundEntity', 'userFundId', {
                type: Sequelize.INTEGER,
                allowNull: false
            });
        })
        .then(() => {
            return queryInterface.sequelize.query(`CREATE UNIQUE INDEX 
                                                    "UserFundEntity_userFundId_entityId_key" 
                                                    ON "UserFundEntity" ("userFundId", "entityId")`);
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.changeColumn('UserFundEntity', 'entityId', {
            type: Sequelize.INTEGER,
            allowNull: true
        })
      .then(() => {
          return queryInterface.changeColumn('UserFundEntity', 'userFundId', {
              type: Sequelize.INTEGER,
              allowNull: true
          });
      })
      .then(() => {
          return queryInterface.sequelize.query('DROP INDEX "UserFundEntity_userFundId_entityId_key"');
      });
    }
};
