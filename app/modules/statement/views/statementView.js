'use strict';

// view for list files (statements)
// author: dmitrii kamaev

const os = require('os');
const config = require('../../../../config/config.json');
const staticPath = require('../../../../config/staticPath.json');
const BASE_URL = `${config.hostname.replace(/\/+$/, '')}:${config.port}`;


exports.renderStatements = function(statements) { return statements.map(renderStatement_); };


function renderStatement_ (statement) {
    return {
        id:        statement.id,
        link:      `${BASE_URL}/${statement.fileName}`,
        dateStart: statement.dateStart, // statement range
        dateEnd:   statement.dateEnd,
        status:    statement.status,
        recommendation: `${BASE_URL}/${statement.recommendation}`,
        conflicts: statement.conflicts
    };
}
