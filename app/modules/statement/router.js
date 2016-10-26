'use strict';

const statementRouter = require('express').Router();

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../../public/uploads/statement'))
    },
    filename: function(req, file, cb) {
        var filename = `sber_statement-${Date.now()}.${file.mimetype.split('/')[1]}`
        req.body.fileName = `statements/${filename}`
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

statementRouter.get('/', versionedController.actionGetAllStatement);
statementRouter.get('/count-payments-test/:orderId',
    versionedController.actionCountPaymentsTest);

module.exports = statementRouter;
