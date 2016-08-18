var express = require('express'),
    router = express.Router();

var OrderController = require('./controllers/OrderController'),
    orderController = new OrderController();

router.get('/payment/rest/register.do', orderController.actionCreateOrder);
router.get('/pay/:orderId/wait/:delay', orderController.actionSetPaid);
router.get('/payment/rest/getOrderStatusExtended.do',
    orderController.actionGetInfo);
router.get('/payment/rest/paymentOrderBinding.do',
    orderController.actionPayByBind);

module.exports = router;
