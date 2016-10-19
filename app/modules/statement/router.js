'use strict';

const statementRouter = require('express').Router();

const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage()
});

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
