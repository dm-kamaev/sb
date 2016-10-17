'use strict'

const MailController = require('./controllers/MailController')
const mailRouter = require('express').Router()
var mailController = new MailController()

var controllersArray = {};
controllersArray['v1'] = mailController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

mailRouter.post('/subscription', versionedController.actionChangeSubscriptions)
mailRouter.get('/ubsubscribe', versionedController.actionUnsubscribe);

module.exports = mailRouter;
