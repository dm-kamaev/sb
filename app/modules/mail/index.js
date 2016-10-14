'use strict'

const mailService = require('./services/mailService'),
    templateService = require('./services/templateService'),
    async = require('asyncawait/async')

module.exports = Object.keys(templateService).reduce((obj, templateName) => {
    var functionName = `send${capitalizeFirstLetter_(templateName)}`
    obj[functionName] = function(email, locals) {
        var emailData = templateService[templateName](locals);
        return mailService.sendMail.call(this, email, emailData)
    }
    return obj;
}, {});

function capitalizeFirstLetter_(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
