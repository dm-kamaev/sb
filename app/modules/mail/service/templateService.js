'use strict';

const ejs = require('ejs');
const path = require('path')
const fs = require('fs')
const await = require('asyncawait/await')
const async = require('asyncawait/async')
const EmailTemplate = require('email-templates').EmailTemplate
const templatesPath = path.join(__dirname, '../../../../public/mail_templates')
const TemplateService = fs.readdirSync(templatesPath).reduce((obj, template) => {
      obj[template] = buildTemplate_.bind(null, path.join(templatesPath, template))
      return obj
}, {})

function buildTemplate_(templateDir, locals) {
    var template = new EmailTemplate(templateDir)
    return await(new Promise((resolve, reject) => {
        template.render(locals, (err, result) => {
            if (err) return reject(err)
            resolve(result)
        })
    }))
};

module.exports = TemplateService;

// (async(function() {
//     var result = TemplateService.beforePayment({
//         userName: 'max',
//         amount: 'asdasd'
//     })
//     console.log(result);
// }))()
