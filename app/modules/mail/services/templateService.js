'use strict';

const ejs = require('ejs');
const path = require('path')
const fs = require('fs')
const await = require('asyncawait/await')
const async = require('asyncawait/async')
const EmailTemplate = require('email-templates').EmailTemplate
const templatesPath = path.join(__dirname, '../../../../public/mail_templates')
const config = require('../../../../config/config')
const HOSTNAME = `${config.hostname.replace(/\/+$/, '')}${~config.hostname.indexOf('https') ? `` : `:${config.port}`}`
const STATIC_PATH = `${HOSTNAME}/mail_static`
const getUnsubscribeLink_ = token => `${HOSTNAME}/mail/unsubscribe?token=${token}`
const Jwt = require('../../auth/services/jwt');
const titles = {};
module.exports = fs.readdirSync(templatesPath).reduce((obj, template) => {
    obj[template] = buildTemplate_.bind(null, path.join(templatesPath, template), template)
    titles[template] = fs.readFileSync(path.join(templatesPath, template, 'title.txt')).toString()
    return obj
}, {})

function buildTemplate_(templateDir, templateName, locals, email) {
    var template = new EmailTemplate(templateDir)
    Object.assign(locals, {
        linkToStatic: STATIC_PATH,
        cancelSubscriptionLink: getUnsubscribeLink_(email)
    })
    var rendered = await (new Promise((resolve, reject) => {
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

function makeUnsubscribeLink_(email) {
    var result = new Jwt().generateToken({
        action: 'verification',
        email
    })

    if (!result.resolve) throw new Error('Error at creating token')

    var token = result.data;

    return getUnsubscribeLink_(token)
}
