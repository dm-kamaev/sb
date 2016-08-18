'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const config = require('../../../../config/mail-config');
const sequelize = require('../../../components/sequelize');
const MailSender = require('nodules/mail').MailSender;
const Letter = require('nodules/mail').Letter;
const transporterGenerator = require('nodules/mail').TransporterGenerator;
const transporter = transporterGenerator.createSMTPTransporter({
    debug: true,
    name: 'cochanges.com'
});
const mailSender = new MailSender(transporter, 'Cбербанк Вместе <noreply@sberbank.com>');

var MailService = {};

MailService.sendMail = function(email, emailData) {
    var letter = new Letter('Подтвердите ваш почтовый ящик', `<div style = "color: red">${emailData}</div>`, 'html');
    await(mailSender.sendMail(email, letter));
    // need for debug
    return emailData;
};

module.exports = MailService;
