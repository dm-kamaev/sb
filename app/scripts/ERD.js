'use strict';

const path = require('path');
const Builder = require('nodules/ERDBuilder');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var configPath = path.join(__dirname, '../../config/db'),
    outPath = path.join(__dirname, `../../ERD/SBER-TOGETHER-${Date.now()}.er`);

var builder = new Builder({
    configPath,
    outputPath: outPath,
    generateImage: true
});

async(() => {
    await(builder.run());
})();
