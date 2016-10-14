'use strict';

const ejs = require('ejs');
const path = require('path')
const fs = require('fs')
const await = require('asyncawait/await')
const async = require('asyncawait/async')
const EmailTemplate = require('email-templates').EmailTemplate
const templatesPath = path.join(__dirname, '../../../../public/mail_templates')
const titles = {};
module.exports = fs.readdirSync(templatesPath).reduce((obj, template) => {
      obj[template] = buildTemplate_.bind(null, path.join(templatesPath, template), template)
      titles[template] = fs.readFileSync(path.join(templatesPath, template, 'title.txt')).toString()
      return obj
}, {})

function buildTemplate_(templateDir, templateName, locals) {
    var template = new EmailTemplate(templateDir)
    var rendered = await(new Promise((resolve, reject) => {
        template.render(locals, (err, result) => {
            if (err) return reject(err)
            resolve(result)
        })
    }))

    return {
        body: rendered.html,
        title: titles[templateName]
    }
};
