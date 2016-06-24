'use strict';

const path = require('path');
const DebugForm = require('nodules/debugForm');

var debugForm = new DebugForm({
    docPath: path.join(__dirname, '../../../../public/doc')
});

module.exports = debugForm.router;
