'use strict';

const authRouter = require('express').Router();

const AuthController = require('./controllers/AuthController');
const authController = new AuthController();
const loggedIn = require('../../components/server/middleware/checkLoggedIn');

var controllersArray = {};
controllersArray['v1'] = authController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

authRouter.get('/test', versionedController.actionTest);
authRouter.post('/logout', versionedController.actionLogout);
authRouter.get('/verify', versionedController.actionVerifyEmail);
authRouter.post('/send', versionedController.actionSendVerification);
authRouter.post('/send-reset', versionedController.actionSendRecoverEmail);
authRouter.post('/reset', versionedController.actionRecoverPassword);
authRouter.use(loggedIn);
authRouter.post('/register', versionedController.actionRegister);
authRouter.post('/login', versionedController.actionLogin);

module.exports = authRouter;
