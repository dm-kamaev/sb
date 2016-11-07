'use strict'

// author: dm-kamaev
// clean db

const util = require('util');
const config_db = require('./config/db.json');
const config_admin = require('./config/admin.json');
const pgp = require('pg-promise')();
const logger = require('../app/components/logger/').getLogger('main');
require('../app/components/implementPromise/')(Promise);
const db = pgp(config_db);

// which table clean, if empty clean all
const WHICH_TABLES = ["Entity", "EntityOtherEntity"];
// const WHICH_TABLES = [];

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
            console.log(new Error(error).stack);
            console.log(error);
        });
})();


// [{ schemaname: 'public', tablename: 'SberUser', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false }, { schemaname: 'public', tablename: 'PayDayHistory', tableowner: 'gorod', tablespace: null, hasindexes: true, hasrules: false, hastriggers: true, rowsecurity: false } ]
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


function cleanTables(queries) {
    var promiseQueries = queries.map(query => db.query(query));
    return Promise.series(promiseQueries)
           .then(res => { console.log(res); })
           .catch(error => {
                console.log(new Error(error).stack);
                console.log(error);
           });
    // console.log(queries);
}


function getTablesForRemove() {
    var tablesForClean = {};
    if (WHICH_TABLES.length) {
        WHICH_TABLES.forEach(tableName => tablesForClean[tableName] = true);
    }
    return tablesForClean;
}