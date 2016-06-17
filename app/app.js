'use strict';
const server = require('./components/server');
const port = process.env.PORT || require('../config/config').port || 3000;
const log = require('./components/logger').getLogger('main');

server.listen(port);

log.info(`Server started at port ${port}`);
