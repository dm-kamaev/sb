const path = require('path');
const DebugForm = require('nodules/debugForm');
const orderRoutes = require('../../../../modules/order/routes.js');

module.exports = function(app) {
    var debugForm = new DebugForm({
        docPath: path.resolve(__dirname, '../../../../../', 'public/doc')
    });
    app.use('/', debugForm.router);
    app.use('/', orderRoutes);
};
