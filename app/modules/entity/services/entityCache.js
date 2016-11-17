'use strict';

const entityService = require('./entityService')
const async = require('asyncawait/async')
var map;
var entityCache = {};

entityCache.recalculate = function(data) {
    var topicsSum = entityService.calculateTopicSum(),
        directionsSum = entityService.calculateDirectionSum(),
        fundsSum = entityService.calculateFundsSum();

    var sum = topicsSum.concat(directionsSum, fundsSum)
                       .map(e => {
                           var res = [
                             e.topicId || e.directionId || e.fundId,
                             parseInt(e.sum)
                           ]
                           return res
                       })

    map = new Map(sum)
};

entityCache.get = function(id) {
    var sum = map.get(parseInt(id))
    if (sum !== undefined) return sum;
    process.nextTick(async(entityCache.recalculate))
    return 0;
};

(async(entityCache.recalculate))();
setInterval(async(entityCache.recalculate), 1000 * 60 * 60 * 24)

module.exports = entityCache
