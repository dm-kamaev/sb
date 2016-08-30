const path = require('path');
const MigrationExecutor = require('nodules/sequelize/MigrationExecutor.js');

var paths = {
    projectRoot: path.resolve(__dirname, '../../..'),
    migrations: 'migrations',
    migrationExecute: 'app/components/sequelize/tmp',
    sequelizeBin: '../node_modules/.bin/sequelize'
};

module.exports = new MigrationExecutor(paths);
