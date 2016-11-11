'use strict'

// author: dm-kamaev
// insert entites in db and create relations

const util = require('util');
const pgpOptions = require('../config/pgpOptions.js');
const config_db = require('../config/db.json');
const pgp = require('pg-promise')(pgpOptions)
const db = pgp(config_db);
const logger = require('../../app/components/logger/').getLogger('tests');
const QueryFile = require('pg-promise').QueryFile;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

async(function () {
    logger.info('Start add entities in db');
    const sqlFiles = [
        readSql('entities.sql'),
        readSql('entityOtherEntity.sql'),
    ];
    try {
        sqlFiles.forEach(file => await(db.any(file)));
        logger.info('Added entities in db');
    } catch (err) {
        logger.critical(err);
    }
    pgp.end();
    logger.info('Terminate db connection pool');
})();

function readSql(fileName) { return new QueryFile('../migrations/'+fileName, {minify: true}); }