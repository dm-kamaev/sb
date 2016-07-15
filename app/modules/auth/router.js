'use strict';

const authRouter = require('express').Router();

const AuthController = require('./controllers/AuthController');
const authController = new AuthController();

authRouter.post('/', authController.actionFindOrCreateUser);
authRouter.post('/logout', authController.actionLogout);
authRouter.get('/test', authController.actionTest);
authRouter.post('/sms', authController.actionSendSMS);
// authRouter.post('/code', authController.actionCode);
authRouter.post('/verify', authController.actionVerifyCode);

module.exports = authRouter;
