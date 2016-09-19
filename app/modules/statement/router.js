'use strict';

const statementRouter = require('express').Router();

const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage()
})

const StatementController = require('./controllers/StatementController');
const statementController = new StatementController();

statementRouter.post('/upload',
    upload.single('statement'),
    statementController.actionUploadStatement);

module.exports = statementRouter;