const migrationWrapper = require('../components/sequelize/migrationsWrapper');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var run = async(function() {
    await(migrationWrapper.migrate());
});

run();
