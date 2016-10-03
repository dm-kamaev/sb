'use strict';

const await = require('asyncawait/await');
const async = require('asyncawait/async');
const sequelize = require('../../../components/sequelize');
const MailSender = require('nodules/mail').MailSender;
const Letter = require('nodules/mail').Letter;
const transporterGenerator = require('nodules/mail').TransporterGenerator;
const transporter = transporterGenerator.createSMTPTransporter({
    debug: true,
    name: 'cochanges.com'
});
const mailSender = new MailSender(transporter, 'Cбербанк Вместе <noreply@sberbank.com>');
const logger = require('../../../components/logger').getLogger('main');

process.on('unhandledRejection', err => logger.error(err));

var MailService = {};

MailService.sendMail = function(email, emailData) {
    var letter = new Letter('Подтвердите ваш почтовый ящик', `<div style = "color: red">${emailData}</div>`, 'html');
    try {
        await(mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL ', err.message);
    }
    // need for debug
    return emailData;
};


/**
 * send email for cron
 * @param  {[str]}  email      adress
 * @param  {[obj]}  emailData
 * @return {[obj]}
 */
MailService.sendMailCron = function(email, emailData) {
    var letter = new Letter(
      'Отработал cron: ' + emailData.cronName,
      '<div>' + (emailData.error || emailData.data) + '</div>',
      'html'
    );
    try {
        await(mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL ', err.message);
    }
    // need for debug
    return emailData;
};


/**
 * send email to user about problems with recurrent payments
 * @param  {[str]}  email      adress
 * @param  {[obj]}  emailData
 * @return {[obj]}
 */
MailService.sendUserRecurrentPayments = function(email, emailData) {
    var letter = new Letter(
      'Ежемесячные списания',
      '<div>' + emailData.data + '</div>',
      'html'
    );
    try {
        await(mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL ', err.message);
    }
    // need for debug
    return emailData;
};


/**
 * send email to user about problems with recurrent payments
 * @param  {[str]}  email      adress
 * @param  {[obj]}  emailData
 * @return {[obj]}
 */
MailService.sendUserRemovedUserFund = function(email, emailData) {
    var letter = new Letter(
      'Ваш юзер фонд был удален',
      '<div>' + emailData.data + '</div>',
      'html'
    );
    try {
        await(mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL ', err.message);
    }
    // need for debug
    return emailData;
};


/**
 * send email to user about problems with recurrent payments
 * @param  {[str]}  email      adress
 * @param  {[obj]}  emailData
 * @return {[obj]}
 */
MailService.sendUserDisableSubcription = function(email, emailData) {
    var letter = new Letter(
      'Ваш платежи приостановлены',
      '<div>' + emailData.data + '</div>',
      'html'
    );
    try {
        await(mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL ', err.message);
    }
    // need for debug
    return emailData;
};

module.exports = MailService;
