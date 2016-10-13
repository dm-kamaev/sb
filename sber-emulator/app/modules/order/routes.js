var express = require('express'),
    router = express.Router();

var OrderController = require('./controllers/OrderController'),
    orderController = new OrderController();

const multer = require('multer');

var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

router.get('/payment/rest/register.do', orderController.actionCreateOrder);
router.get('/pay/:orderId/wait/:delay', orderController.actionSetPaid);
router.get('/payment/rest/getOrderStatusExtended.do',
    orderController.actionGetInfo);
router.post('/payment/rest/paymentOrderBinding.do', upload.any(),
    orderController.actionPayByBind);
router.get('/client/:clientId/last', orderController.actionLastOrderFromClient);
router.post('/fail/:fail', orderController.actionFailOrders);
router.post('/failBindings/:fail', orderController.actionFailBoundPayments);
module.exports = router;
