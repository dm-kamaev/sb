'use strict';

const callbackRouter = require('express').Router();
const CallbackController = require('./controllers/CallbackController');
const callbackController = new CallbackController();

callbackRouter.get('/', callbackController.actionCallback);

module.exports = callbackRouter;
