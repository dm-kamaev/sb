'use strict';

const async = require('asyncawait/async')
const mail = require('../modules/mail');
const argv = require('yargs').argv;
const TYPE = argv.type
const EMAIL = argv.email;

(async(function(){
  if (!TYPE) throw new Error('Specify type of email "--type \'confirmation\'"')
  if (!EMAIL) throw new Error('Specify email "--email \'example@mail.com\'"')
  // console.log(NAME, EMAIL);

  var methodName = `send${TYPE.charAt(0).toUpperCase() + TYPE.slice(1)}`
  if (typeof mail[methodName] != 'function') throw new Error(`no such mail "${TYPE}"`)

  mail[methodName](EMAIL, {
    userName: EMAIL,
    link: 'http://google.com',
    amount: 100
  })
}))()
