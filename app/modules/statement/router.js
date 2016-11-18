'use strict';

const statementRouter = require('express').Router();

const multer = require('multer');
const path = require('path');
const async = require('asyncawait/async');
const statementService = require('./services/statementService');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../../public/uploads/statement'))
    },
    filename: function(req, file, cb) {
        var filename = `sber_statement-${Date.now()}.${file.mimetype.split('/')[1]}`
        req.body.fileName = `statement/${filename}`
        cb(null, filename)
    }
})
const upload = multer({ storage });

const StatementController = require('./controllers/StatementController');
const statementController = new StatementController();

var controllersArray = {};
controllersArray.v1 = statementController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

statementRouter.post(
    '/upload',
    upload.single('statement'),
    versionedController.actionUploadStatement
);
// statementRouter.get('/:id(\\d+)/excel',
//     versionedController.actionGetExcelStatement)

// sending buffer isn't implemented in controller for now
statementRouter.get('/:id(\\d+)/excel', async(function(req, res) {
    var id       = req.params.id,
        workbook = statementService.getExcelStatement(id),
        buffer   = statementService.getBuffer(workbook);

    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.set('Content-disposition', `attachment;filename=statement-${Date.now()}.xlsx`)
    res.end(buffer)
}))
statementRouter.get('/', versionedController.actionGetAllStatement);
statementRouter.get('/count-payments-test/:orderId',
    versionedController.actionCountPaymentsTest);
statementRouter.delete('/:id(\\d+)', versionedController.actionDeleteStatement)

module.exports = statementRouter;
