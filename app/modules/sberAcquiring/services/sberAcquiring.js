'use strict';

const await = require('asyncawait/await');
const configSberAcquiring = require('../../../../config/config-sberAcquiring.json');
const ENV = require('../../../../config/config.json').environment;
const axios = require('axios').create({
    baseURL: configSberAcquiring.hostname,
    validateStatus: (status) => { return status >= 200 && status < 500; },
});
const errors = require('../../../components/errors');
const requestPromise = require('../../../components/requestPromise');
const request = require('request');

const sberAcquiring = {};

/* params –– {
  userName: 'aventica-api',
  password: 'aventica',
  amount: '100',
  clientId: '2', // The number (ID) of the customer in the shop system. Is used to implement the functionality of the ligaments. The store must have permission to use the ligaments.
  orderNumber: '15', // The ID of the order in the shop system that is unique to each store within the system
  returnUrl: 'http://sbervm.ru:3000/pay/paid/2/', // The address to which you must redirect the user in case of successful payment
  failUrl:   'http://sbervm.ru:3000/pay/failed/2/', // The address to which you must redirect the user in case of failed payment
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
sberAcquiring.firstPay = function(params) {
    if (!params.jsonParams) {
        params.jsonParams = JSON.stringify({
            // recurringFrequency: configSberAcquiring.recurringFrequency,
            // recurringExpiry: configSberAcquiring.recurringExpiry,
            environment: ENV
        });
    }

    try {
        return await(axios.get(configSberAcquiring.registerOrder, {
            params: {
                userName: params.userName || configSberAcquiring.userName,
                password: params.password || configSberAcquiring.password,
                amount: params.amount,
                orderNumber: params.orderNumber,
                returnUrl: params.returnUrl,
                failUrl: params.failUrl,
                language: 'ru',
                clientId: params.clientId,
                jsonParams: params.jsonParams,
            }
        })).data;
    } catch (err) {
        throw new errors.AcquiringError(err.message)
    }
};

    /* params –– {
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
sberAcquiring.getStatusAndGetBind = function(params) {
    try {
      return await(axios.get(configSberAcquiring.getStatusOrder, {
          params: {
              userName: params.userName || configSberAcquiring.userName,
              password: params.password || configSberAcquiring.password,
              language: 'ru',
              orderNumber: params.orderNumber || params.sberAcquOrderNumber,
              orderId: params.orderId || params.sberAcquOrderId
          }
      })).data;
    } catch (err) {
        throw new errors.AcquiringError(err.message)
    }
};


/* params ––
    { amount:      333,
      orderNumber: 76,
      returnUrl:   config.hostname+'#sucess',
      failUrl:     config.hostname+'#failed',
      language:    'ru',
      clientId:    73,
     }
  responce –– {
   // number pay
   orderId: 'aad5141d-da93-4b95-8dee-4c80031a1b44',
   // where redirect
   formUrl: 'https://3dsec.sberbank.ru/payment/merchants/aventica/payment_ru.html?mdOrder=4ccf2517-66d4-404f-ad97-ae5497258737'
 } or {
     errorCode: '1',
     errorMessage: 'Заказ с таким номером уже обработан',
    }*/
// orderId is mdOrder for payByBind
sberAcquiring.createPayByBind = function(params) {
    try {
      return await(axios.get(configSberAcquiring.registerOrder, {
          params: {
              userName: params.userName || configSberAcquiring.userNameSsl,
              password: params.password || configSberAcquiring.passwordSsl,
              amount: params.amount,
              orderNumber: params.sberAcquOrderNumber,
              returnUrl: params.returnUrl || 'http://google.com',
              failUrl: params.failUrl || 'http://google.com',
              language: 'ru',
              clientId: params.clientId,
              jsonParams: {
                  environment: ENV
              }
          }
      })).data;
    } catch (err) {
        throw new errors.AcquiringError(err.message)
    }
};

sberAcquiring.createAqOrder = function(params) {
    try {
      return await(axios.get(configSberAcquiring.registerOrder, {
          params: {
              userName: params.userName,
              password: params.password,
              amount: params.amount,
              orderNumber: params.sberAcquOrderNumber,
              returnUrl: params.returnUrl || 'http://google.com',
              failUrl: params.failUrl || 'http://google.com',
              language: 'ru',
              clientId: params.clientId,
              jsonParams: {
                  environment: ENV
              }
          }
      })).data;
    } catch (err) {
        throw new errors.AcquiringError(err.message)
    }
}


/* params –– {
    orderId:   '6984845d-f910-4b49-9fed-9aa3159e2b9b',
    bindingId: '332b4837-0b9d-4e8a-bcd3-e77e1b46d3db',
   }
   responce –– {
     "redirect":"http://sbervm.ru:3000/#sucess?orderId=6984845d-f910-4b49-9fed-9aa3159e2b9b",
     "info":"Ваш платёж обработан, происходит переадресация...",
     "errorCode":0
    } or {
     "error":"Связка не найдена",
     "errorCode":2,
     "errorMessage":"Связка не найдена"
    }
*/
sberAcquiring.payByBind = function(params) {
    var data = {
        userName: params.userName || configSberAcquiring.userNameSsl,
        password: params.password || configSberAcquiring.passwordSsl,
        mdOrder: params.orderId || params.sberAcquOrderId,
        bindingId: params.bindingId,
        language: 'ru',
    };

    try {
      return requestPromise.post(
        configSberAcquiring.hostname + configSberAcquiring.payByBind,
        data
      ).body;
    } catch(err) {
        throw new errors.AcquiringError(err.message)
    }
};


module.exports = sberAcquiring;
