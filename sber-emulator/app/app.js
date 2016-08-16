const logger = require('./components/logger/logger');
const server = require('./components/server');
const path = require('path');

const StartupControll = require('nodules/startupControll');
const MigrationChecker = require('nodules/startupControll/MigrationChecker');

var checkers = [
    new MigrationChecker({
        sequelize: require('./components/sequelize/sequelize'),
        globPath: path.resolve(__dirname, './modules/**/migrations/*.js'),
        isMandatory: true
    })
];


var launchServer = function() {
    StartupControll.check(checkers).then(() => {
        server.listen(3005, function() {
            var host = server.address().address;
            var port = server.address().port;
            logger.getLogger('main').info(
                'Server started at http://%s:%s', host, port
            );
        });
    });
};


module.exports = server;
/**
 * if this module is not required launch server
 **/
if (!module.parent) {
    launchServer();
}
