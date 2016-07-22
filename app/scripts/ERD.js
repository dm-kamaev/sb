'use strict';

const path = require('path');
const Builder = require('nodules/ERDBuilder');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

var builder = new Builder({
    configPath: path.join(__dirname, '../../config/db'),
    outputPath: path.join(__dirname, `../../ERD/SBER-TOGETHER-${Date.now()}.er`),
    generateImage: true
});

async(() => {
  await(builder.run())
})();
