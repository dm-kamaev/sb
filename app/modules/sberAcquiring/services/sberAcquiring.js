'use strict';

const async = require('asyncawait/async');
const await = require('asyncawait/await');
const axios = require('axios').create({ baseURL: 'https://3dsec.sberbank.ru' });
const config              = require('../../../../config/config.json');
const configSberAcquiring = require('../../../../config/config_sberAcquiring.json');
const errors = require('../../../components/errors');
var request = require('request');
const log = console.log;

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
    try {
        return await(axios.get('/payment/rest/register.do?', {
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
        throw new errors.HttpError('Failed connection with sberbank acquiring', 500);
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
        return await(axios.get('/payment/rest/getOrderStatusExtended.do?', {
            params: {
                userName: params.userName || configSberAcquiring.userName,
                password: params.password || configSberAcquiring.password,
                language: 'ru',
                orderNumber: params.orderNumber,
                orderId: params.orderId,
                clientId: params.clientId,
            }
        })).data;
    } catch (e) {
        throw new errors.HttpError('Failed connection with sberbank acquiring', 500);
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
// orderId is mdOrder for actionPayByBind
sberAcquiring.actionCreatePayByBind = function (params) {
  try {
      return await (axios.get('/payment/rest/register.do?', {
          params: {
              userName: params.userName || configSberAcquiring.userNameSsl,
              password: params.password || configSberAcquiring.passwordSsl,
              amount:      params.amount,
              orderNumber: params.orderNumber,
              returnUrl:   params.returnUrl,
              failUrl:     params.failUrl,
              language:    'ru',
              clientId:    params.clientId,
          }
      })).data;
  } catch (e) {
      throw new errors.HttpError('Failed connection with sberbank acquiring', 500);
  }
};


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
sberAcquiring.actionPayByBind = function (params) {
    var data = {
        userName:  params.userName || configSberAcquiring.userNameSsl,
        password:  params.password || configSberAcquiring.passwordSsl,
        mdOrder:   params.orderId,
        bindingId: params.bindingId,
        language: 'ru',
    };
    return await(new Promise((resolve, reject) => {
        request.post({
            url: 'https://3dsec.sberbank.ru/payment/rest/paymentOrderBinding.do',
            formData: data
        }, function(err, httpResponse, body) {
            if (err) {
                reject(new errors.HttpError('Failed connection with sberbank acquiring', 500));
            } else {
                resolve(body);
            }
        });
    }));
};

module.exports = sberAcquiring;


/* EXAMPLE USE */
// async(()=>{
//   var responceSberAcqu = await(sberAcquiring.getStatusAndGetBind({
//     orderNumber: 38,
//     orderId: '3ec6b463-3637-423f-9c23-d9f41f7bd85b',
//     clientId: 73,
//   }));
//   // 73 bindingId: '332b4837-0b9d-4e8a-bcd3-e77e1b46d3db'
//   console.log(responceSberAcqu);
// })();

// actionCreatePayByBind();
// function actionCreatePayByBind () {
//     async(()=>{
//       var responceSberAcqu = await(sberAcquiring.actionCreatePayByBind({
//         amount:      333,
//         orderNumber: 76,
//         returnUrl:   config.hostname+'#sucess',
//         failUrl:     config.hostname+'#failed',
//         language:    'ru',
//         clientId:    73,
//       }));
//       // orderId: '6984845d-f910-4b49-9fed-9aa3159e2b9b'
//       console.log('actionCreatePayByBind=', responceSberAcqu);
//     })();
// }


// actionPayByBind();
// function actionPayByBind () {
//     async(()=>{
//       var responceSberAcqu = await(sberAcquiring.actionPayByBind({
//         orderId:   '6984845d-f910-4b49-9fed-9aa3159e2b9b',
//         bindingId: '332b4837-0b9d-4e8a-bcd3-e77e1b46d3db',
//       }));
//       console.log('responceSberAcqu=', responceSberAcqu);
//     })();
// }