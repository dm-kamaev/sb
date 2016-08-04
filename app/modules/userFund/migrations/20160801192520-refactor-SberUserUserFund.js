'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('SberUserUserFund', 'currentAmountId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'DesiredAmountHistory',
                key: 'id'
            },
            allowNull: false
        })
            .then(() => {
                return queryInterface.addColumn('SberUserUserFund', 'enabled', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                });
            })
            .then(() => {
                return queryInterface.addIndex('SberUserUserFund',
                    ['sberUserId', 'userFundId'], {
                        indexName: 'SberUserUserFund_userFundId_sberUserId_key',
                        indicesType: 'UNIQUE'
                    });
            });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('SberUserUserFund', 'currentAmountId')
                .then(() => {
                    return queryInterface.removeColumn('SberUserUserFund', 'enabled');
                })
                .then(() => {
                    return queryInterface.removeIndex('SberUserUserFund',
                                'SberUserUserFund_userFundId_sberUserId_key');
                });
    }
};
