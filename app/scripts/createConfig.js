'use strict';
var path = require('path');
var ConfigBuilder = require('nodules/configBuilder');

(function() {
    var configPath = path.join(__dirname, '../..', 'config');
    var env = process.argv.slice(2)[0] || 'dev';
    var configBuilder = new ConfigBuilder(configPath);
    configBuilder.build(env);
})();
