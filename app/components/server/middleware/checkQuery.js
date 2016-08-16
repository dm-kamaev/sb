'use strict';

const _ = require('lodash');

module.exports = (req, res, next) => {
    req.query.include = parseTypes(req.query.include);
    req.query.type = parseTypes(req.query.type);
    next();
};
/**
  * @param param {string} query param
  *
  */
function parseTypes(param) {
    var arr = _.castArray(param);
    return arr.filter(e => e == 'fund' || e == 'topic' || e == 'direction');
}
