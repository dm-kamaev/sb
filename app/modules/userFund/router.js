'use strict';

var userFundRouter = require('express').Router();
const errors = require('../../components/errors');
const anonymous = require('../../components/server/middleware/anonymous');

var UserFundController = require('./controllers/UserFundController');
var userFundController = new UserFundController();

var controllersArray = {};
controllersArray['v1'] = userFundController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);


userFundRouter.get('/', versionedController.actionGetUserFunds);
userFundRouter.get('/:id(\\d+)', versionedController.actionGetUserFund);
userFundRouter.get('/count', versionedController.actionCountUserFunds);
// userFundRouter.post('/', userFundController.actionCreateUserFund);
// userFundRouter.delete('/:id(\\d+)', userFundController.actionDeleteUserFund);
userFundRouter.put('/:id(\\d+)', userFundController.actionUpdateUserFund);
userFundRouter.use(anonymous);

userFundRouter.post('/:entityId(\\d+)', versionedController.actionAddEntity);
userFundRouter.delete('/:entityId(\\d+)',
                versionedController.actionRemoveEntity);
userFundRouter.get('/entity', versionedController.actionGetEntities);
userFundRouter.use((req, res, next) => {
    if (req.user && req.user.authId) return next();
    throw new errors.HttpError('Unathorized', 403);
});
userFundRouter.post('/amount', versionedController.actionSetAmount);
userFundRouter.get('/amount', versionedController.actionGetCurrentAmount);

userFundRouter.post('/switching-subscriptions', versionedController.actionSwitchingSubscriptions);
userFundRouter.post('/remove-userFund', versionedController.actionRemoveUserFund);
userFundRouter.get(
  '/get-status-subscription-userFund/:id(\\d+)?',
  versionedController.actionGetStatusSubscriptionUserFund
);

module.exports = userFundRouter;
