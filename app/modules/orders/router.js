'use strict';

const orderRouter = require('express').Router();
const await = require('asyncawait/await');
const errors = require('../../components/errors');
const SECRET = require('../../../config/admin-config').secret;
const checkToken = require('nodules/checkAuth').CheckToken(SECRET);

const OrderController = require('./controllers/OrderController');
var orderController = new OrderController();

var controllersArray = {};
controllersArray['v1'] = orderController;

var VersionedController = require('nodules/controller').VersionedController;
var versionedController = new VersionedController(controllersArray);

orderRouter.get('/:sberAcquOrderNumber(\\d+)', versionedController.actionGetOrderStatus);
orderRouter.get('/:sberAcquOrderNumber(\\d+)/entity', versionedController.actionGetOrderComposition);


module.exports = orderRouter;
