'use strict';

const fork = require('child_process').fork;
const path = require('path');
const SERVICE_PATH = path.join(__dirname, '../../node_modules/auth-service');

fork(path.join(SERVICE_PATH, '/app.js'), [
    path.join(__dirname, '../../config/auth-config'),
    path.join(__dirname, '../../user-service.log')
], {
    cwd: SERVICE_PATH
});
