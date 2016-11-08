'use strict'

// author: dm-kamaev
// clean db all or selected tables
// EXAMPLE: node integration-tests/cleanDatabase.js --tables=Entity,EntityOtherEntity

const util = require('util');
const config_db = require('../config/db.json');
const config_admin = require('../config/admin.json');
const pgp = require('pg-promise')();
const logger = require('../../app/components/logger/').getLogger('main');
const db = pgp(config_db);
const argv = require('yargs').argv;
require('../../app/components/implementPromise/')(Promise);

// which table clean, if empty clean all
var WHICH_TABLES = [];
// var WHICH_TABLES = ["Entity", "EntityOtherEntity"];
if (argv.tables) { WHICH_TABLES = argv.tables.split(','); }

(function() {
    logger.info('Clean table: '+((WHICH_TABLES.length > 0) ? '"'+WHICH_TABLES.join('","')+'"' : 'all'));
    var query = `
    SELECT *
    FROM pg_catalog.pg_tables
    WHERE schemaname != 'pg_catalog' AND
          schemaname != 'information_schema' AND
          tablename  != 'SequelizeMeta'
    `;
    db.query(query)
        .then(getTables)
        .then(cleanTables)
        .catch(error => {
            logger.critical(new Error(error).stack);
            console.log(error);
        });
})();



/**
 * get tables
 * @param  {[array]} tables [{ schemaname: 'public', tablename: 'SberUser', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false }, { schemaname: 'public', tablename: 'PayDayHistory', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false } ]
 * @return {[array]}  [ 'TRUNCATE TABLE "SberUser" RESTART IDENTITY CASCADE', ... ]
 */
function getTables(tables) {
    var queries = [],
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
    console.log(queries);
    var promiseQueries = queries.map(query => {
        return new Promise((resolve,reject) => {
            setTimeout(function() {
                db.query(query)
                  .then(res => resolve(res))
                  .catch(err => reject(err));
            }, 2000);
        });
    });
    return Promise.series(promiseQueries)
           .then(res => { logger.info('OK: '+res); })
           .catch(error => {
                logger.critical(new Error(error).stack);
                console.log(error);
           });
    // console.log(queries);
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