'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('ALTER TABLE "StatementItem" DROP CONSTRAINT IF EXISTS "StatementItem_pkey"')
          .then(() => {
              return queryInterface.sequelize.query('ALTER TABLE "StatementItem" DROP COLUMN IF EXISTS "id"');
          })
          .then(() => {
              return queryInterface.sequelize.query('ALTER TABLE "StatementItem" ADD PRIMARY KEY ("sberAcquOrderNumber")');
          });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('ALTER TABLE "StatementItem" DROP CONSTRAINT IF EXISTS "StatementItem_pkey"')
          .then(() => {
              return queryInterface.sequelize.query(`ALTER TABLE "StatementItem"
            ADD COLUMN id INTEGER PRIMARY KEY
            NOT NULL DEFAULT nextval('"Statement_id_seq"'::regclass)`);
          });
    }
};
