'use strict';

const authRouter = require('express').Router();

const AuthController = require('./controllers/AuthController');
const authController = new AuthController();
const loggedIn = require('../../components/server/middleware/checkLoggedIn');

authRouter.get('/test', authController.actionTest);
authRouter.post('/logout', authController.actionLogout);
authRouter.all('*', loggedIn);
authRouter.post('/', authController.actionFindOrCreateUser);
authRouter.post('/sms', authController.actionSendSMS);
authRouter.post('/verify', authController.actionVerifyCode);

module.exports = authRouter;
