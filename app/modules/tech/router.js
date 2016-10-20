'use strict';

const techRouter = require('express').Router();

const TechController = require('./controllers/TechController');
const techController = new TechController();

var controllersArray = {};
controllersArray.v1 = techController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);


techRouter.get('/version', versionedController.actionGetCurrentVersion);

module.exports = techRouter;
