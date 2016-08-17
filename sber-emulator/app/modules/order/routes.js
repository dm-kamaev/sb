var express = require('express'),
    router = express.Router();

var OrderController = require('./controllers/OrderController'),
    orderController = new OrderController();

router.get('/payment/rest/register.do', orderController.actionFirstPay);
router.get('/pay/:orderId/wait/:delay', orderController.actionSetPaid);
router.get('/payment/rest/getOrderStatusExtended.do',
    orderController.actionGetInfo);

module.exports = router;
