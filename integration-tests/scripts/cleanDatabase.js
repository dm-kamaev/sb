'use strict'

// author: dm-kamaev
// clean db all or selected tables
// EXAMPLE: node integration-tests/cleanDatabase.js --tables=Entity,EntityOtherEntity

const util = require('util');
const pgpOptions = require('../config/pgpOptions.js');
const config_db = require('../config/db.json');
const pgp = require('pg-promise')(pgpOptions);
const db = pgp(config_db);
const logger = require('../../app/components/logger/').getLogger('tests');
const argv = require('yargs').argv;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

// which table clean, if empty clean all
var WHICH_TABLES = [];
// var WHICH_TABLES = ["Entity", "EntityOtherEntity"];
if (argv.tables) { WHICH_TABLES = argv.tables.split(','); }

async(function() {
    logger.info('Clean table: '+((WHICH_TABLES.length > 0) ? '"'+WHICH_TABLES.join('","')+'"' : 'all'));
    var query = `
    SELECT *
    FROM pg_catalog.pg_tables
    WHERE schemaname != 'pg_catalog' AND
          schemaname != 'information_schema' AND
          tablename  != 'SequelizeMeta'
    `;
    try {
        var tables = await(db.query(query));
        var queries = getTables(tables);
        console.log(queries);
        await(cleanTables(queries));
        logger.info('Tables clean');
    } catch (err) {
        logger.critical(err);
        console.log(err);
    }
    pgp.end();
    logger.info('Terminate db connection pool');
})();


/**
 * get tables
 * @param  {[array]} tables [{ schemaname: 'public', tablename: 'SberUser', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false }, { schemaname: 'public', tablename: 'PayDayHistory', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false } ]
 * @return {[array]}  [ 'TRUNCATE TABLE "SberUser" RESTART IDENTITY CASCADE', ... ]
 */
function getTables(tables) {
    var queries         = [],
        tablesForRemove = getTablesForRemove();
    if (!Object.keys(tablesForRemove).length) {
        tables.forEach(table => {
            queries.push(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
        });
    } else {
        tables.forEach(table => {
            var tabelName = table.tablename;
            if (tablesForRemove[tabelName]) {
                queries.push(`TRUNCATE TABLE "${tabelName}" RESTART IDENTITY CASCADE`);
            }
        });
    }
    return queries;
}


/**
 * cleanTables
 * @param  {[array]} queries  [ 'TRUNCATE TABLE "SberUser" RESTART IDENTITY CASCADE', ... ]
 * @return {[type]}         [description]
 */
function cleanTables(queries) {
    queries.forEach(query => await(db.query(query)));
}


/**
 * getTablesForRemove
 * @return {[obj]} { 'SberUser': true }
 */
function getTablesForRemove() {
    var tablesForClean = {};
    if (WHICH_TABLES.length) {
        WHICH_TABLES.forEach(tableName => tablesForClean[tableName] = true);
    }
    return tablesForClean;
}