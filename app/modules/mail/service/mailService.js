'use strict';

const MailService = {}

MailService.sendMessage = function(email, emailData) {
    var title = emailData.title,
        body = emailData.body,
        markup = emailData.markup || 'html',
        letter = new Letter(title, body, markup)

    if (!isValid_(email)) throw new Error('Invalid email')

    try {
        await (mailSender.sendMail(email, letter));
    } catch (err) {
        logger.critical('ERROR AT SENDING MAIL', err.message)
    }
}

function isValid_(email) {
    var mailRegex = new RegExp([
        '^[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?' +
        '^_`{|}~-]+(?:\\.' +
        '[a-z0-9\\u007F-\\uffff!#$%&\\\'*+\\/=?^_`{|}~-]+)*@(?:[a-z0-9]' +
        '(?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{1,}$'
    ].join(''), 'i');

    return mailRegex.test(email)
}

module.exports = MailService
