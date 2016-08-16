var express = require('express'),
    router = express.Router();

var OrderController = require('./controllers/OrderController'),
    orderController = new OrderController();

router.get('/payment/rest/register.do', orderController.actionFirstPay);
router.get('/pay/:orderId', orderController.actionSetPaid);
router.get('/payment/rest/getOrderStatusExtended.do', orderController.actionGetInfo);

module.exports = router;
