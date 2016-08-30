'use strict';

const authRouter = require('express').Router();

const AuthController = require('./controllers/AuthController');
const authController = new AuthController();
const loggedIn = require('../../components/server/middleware/checkLoggedIn');

 // authRouter.get('/test', authController.actionTest);
 // authRouter.post('/logout', authController.actionLogout);
 // authRouter.get('/verify', authController.actionVerifyEmail);
 // authRouter.post('/send', authController.actionSendVerification);
 // authRouter.use(loggedIn);


authRouter.get('/test', authController.actionTest);
authRouter.post('/logout', authController.actionLogout);
authRouter.use(loggedIn);
authRouter.post('/', authController.actionFindOrCreateUser);
authRouter.post('/sms', authController.actionSendSMS);
authRouter.post('/verify', authController.actionVerifyCode);

// TODO: Test new reg without verify
authRouter.post('/register', authController.actionRegister);
authRouter.post('/login', authController.actionLogin);

module.exports = authRouter;
