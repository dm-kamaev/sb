const migrationWrapper = require('../components/sequelize/migrationsWrapper');

var async = require('asyncawait/async');
var await = require('asyncawait/await');
var run = async(function() {
    var amount = process.argv[2] || 1;
    amount = parseInt(amount);
    await(migrationWrapper.rollback(amount));
});

run();
