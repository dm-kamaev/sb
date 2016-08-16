'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addIndex('EntityOtherEntity',
        ['entityId', 'otherEntityId'], {
            indexName: 'EntityOtherEntity_entityId_otherEntityId_key',
            indicesType: 'UNIQUE'
        });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeIndex('EntityOtherEntity', 'EntityOtherEntity_entityId_otherEntityId_key');
  }
};
