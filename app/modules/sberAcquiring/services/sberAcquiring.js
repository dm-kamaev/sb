"use strict";

// const Controller = require('nodules/controller').Controller;
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const axios = require('axios').create({ baseURL: 'https://3dsec.sberbank.ru/' });
const configSberAcquiring = require('../../../../config/config_sberAcquiring.json');
const errors = require('../../../components/errors');
const log = console.log;


class sberAcquiring {
    /*params –– {
      userName: 'aventica-api',
      password: 'aventica',
      amount: '100',
      clientId: '2', // The number (ID) of the customer in the shop system. Is used to implement the functionality of the ligaments. The store must have permission to use the ligaments.
      orderNumber: '15', // The ID of the order in the shop system that is unique to each store within the system
      returnUrl: 'http://sbervm.ru:3000/pay/paid/2/',
      jsonParams: JSON.stringify({
        "recurringFrequency": "10",
        "recurringExpiry": "20161001"
      }),
    }*/
    /* responce –– {
       // number pay
       orderId: '4ccf2517-66d4-404f-ad97-ae5497258737',
       // where redirect
       formUrl: 'https://3dsec.sberbank.ru/payment/merchants/aventica/payment_ru.html?mdOrder=4ccf2517-66d4-404f-ad97-ae5497258737'
     } or {
         errorCode: '1',
         errorMessage: 'Заказ с таким номером уже обработан',
        }
     */
    actionFirstPay (params) {
        try {
            return await(axios.get('/payment/rest/register.do?', {
                params: {
                    userName: params.userName,
                    password: params.password,
                    amount: params.amount,
                    orderNumber: params.orderNumber,
                    returnUrl: params.returnUrl,
                    language: 'ru',
                    clientId: params.clientId,
                    jsonParams: params.jsonParams,
                }
            }));
        } catch (err) {
            throw new errors.HttpError('Failed connection with sberbank acquiring', 500);
        }
    }
    /*params –– {
        userName: 'aventica-api',
        password: 'aventica',
        clientId: '2', // The number (ID) of the customer in the shop system. Is used to implement the functionality of the ligaments. The store must have permission to use the ligaments.
        orderNumber: '17', // The ID of the order in the shop system that is unique to each store within the system
        orderId: '5292844c-cf63-4da6-bc18-8f8e8a4a8597', // The ID of the order in the shop system that is unique to each store within the system
    }*/
    /* responce –– {
      "errorCode": "0",
      "errorMessage": "Успешно",
      "orderNumber": "re698",
      "orderStatus": 2,
      "actionCode": 0,
      "actionCodeDescription": "",
      "amount": 100,
      "currency": "643",
      "date": 1469624760247,
      "orderDescription": "",
      "ip": "46.148.192.34",
      "merchantOrderParams": [{
        "name": "recurringExpiry",
        "value": "20161001"
      }, {
        "name": "recurringFrequency",
        "value": "10"
      }],
      "attributes": [{
        "name": "mdOrder",
        "value": "35daf604-3f8d-4107-9c24-d5d108d6d0ad"
      }],
      "cardAuthInfo": {
        "expiration": "201912",
        "cardholderName": "Vasya",
        "approvalCode": "123456",
        "pan": "411111**1111"
      },
      "bindingInfo": {
        "clientId": "1",
        "bindingId": "bd420dc5-c2f7-4d48-aad9-c5d2f90e1fc1"
      },
      "authDateTime": 1469624953411,
      "terminalId": "123456",
      "authRefNum": "111111111111",
      "paymentAmountInfo": {
        "paymentState": "DEPOSITED",
        "approvedAmount": 100,
        "depositedAmount": 100,
        "refundedAmount": 0
      },
      "bankInfo": {
        "bankName": "TEST CARD",
        "bankCountryCode": "RU",
        "bankCountryName": "Россия"
      }
    }*/
    actionGetStatusAndGetBind (params) {
        try {
            return await(axios.get('/payment/rest/getOrderStatusExtended.do?', {
                params: {
                    userName:    params.userName,
                    password:    params.password,
                    language:    'ru',
                    orderNumber: params.orderNumber,
                    orderId:     params.orderId,
                    clientId:    params.clientId,
                }
            }));
        } catch (e) {
             throw new errors.HttpError('Failed connection with sberbank acquiring', 500);
        }

    }

     // TODO: Create
     actionCreatePayByBind () {}

     // TODO: Create
     actionPayByBind () {}
}
module.exports = sberAcquiring;


/* EXAMPLE USE */
// var sberAcquiring = new SberAcquiring();
// var firstPay = async(() => {
//   return await(sberAcquiring.actionFirstPay({
//         userName: configSberAcquiring.userName,
//         password: configSberAcquiring.password,
//         amount: '100',
//         clientId: '2', // The number (ID) of the customer in the shop system. Is used to implement the functionality of the ligaments. The store must have permission to use the ligaments.
//         orderNumber: '23', // The ID of the order in the shop system that is unique to each store within the system
//         returnUrl: 'http://sbervm.ru:3000/pay/paid/2/',
//         jsonParams: JSON.stringify({
//           "recurringFrequency": "10",
//           "recurringExpiry": "20161001"
//         }),
//     }));
// });


// firstPay().then(function (responce) {
//     var data = responce.data;
//     log('data=', data);
//     // if (responce.orderId && responce.formUrl) {
//     //   log('right responce = ', responce);
//     // } else if (responce.errorCode && responce.errorMessage) {
//     //   log('wrong responce = ', responce);
//     // } else {
//     //   log('unknown responce = ', responce);
//     // }
// }).catch(function (err) {
//     log('ERROR=', err);
// });


// var getStatus = async(() => {
//   return await(sberAcquiring.actionGetStatusAndGetBind({
//         userName: configSberAcquiring.userName,
//         password: configSberAcquiring.password,
//         clientId: '2', // The number (ID) of the customer in the shop system. Is used to implement the functionality of the ligaments. The store must have permission to use the ligaments.
//         orderNumber: '23', // The ID of the order in the shop system that is unique to each store within the system
//         orderId:     '1a34bfdd-4941-4dcf-9948-4c19ca51cf47', // The ID of the order in the shop system that is unique to each store within the system
//     }));
// });

// getStatus().then(function (responce) {
//     var data = responce.data;
//     log('data=', data);
//     // WE SAVE actionCode: 0, actionCodeDescription: '',
//     // bindingId: '441966f2-d176-4ba8-9a30-596a24f87ec4'
//     // if (responce.errorCode === 0 && responce.errorMessage === '') {
//     //   log('right responce (bindingId) =', responce.bindingInfo.bindingId);
//     // } else {
//     //   log('wrong responce = ', responce);
//     // }
// }).catch(function (err) {
//     log('ERROR=', err);
// });