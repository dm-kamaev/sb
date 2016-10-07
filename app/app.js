'use strict';
const server = require('./components/server');
// const port = process.env.PORT || require('../config/config').port || 3000;
const PORT = process.env.PORT || 3000;
const log = require('./components/logger').getLogger('main');
const cluster = require('cluster');

const NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV === 'development') {
    server.listen(PORT);
    log.info(`Server started at port ${PORT}`);
} else {
    clustering();
}


function clustering () {
    if (cluster.isMaster) {
        var workerNum = require('os').cpus().length;
        log.info('Starting %s workers', workerNum);
        for (var i = 0; i < workerNum; i++) {
            cluster.fork();
        }

        cluster.on('exit', function(worker) {
            cluster.fork()
        })
    } else {
        server.listen(PORT);
        log.info(`Server started at port ${PORT}`);
    }
}
