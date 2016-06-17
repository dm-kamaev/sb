'use strict';
const migrationsWrapper = require('../components/sequelize/migrationsWrapper');
const await = require('asyncawait/await');
const async = require('asyncawait/async');

(async(function() {
    await(migrationsWrapper.migrate());
}))();
