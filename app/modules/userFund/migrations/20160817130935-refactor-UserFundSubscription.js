'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('DesiredAmountHistory',
                'sberUserUserFundId', 'userFundSubscriptionId')
            .then(() => {
                return queryInterface.renameColumn('Order', 'sberUserUserFundId',
                    'userFundSubscriptionId')
            })
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.renameColumn('DesiredAmountHistory',
                'userFundSubscriptionId', 'sberUserUserFundId')
            .then(() => {
                return queryInterface.renameColumn('Order', 'userFundSubscriptionId',
                    'sberUserUserFundId')
            })
    }
};
