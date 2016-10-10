'use strict';

var nonSPARouter = require('express').Router();
var entityService = require('../../../modules/entity/services/entityService');
const userFundService =
    require('../../../modules/userFund/services/userFundService');
const entityView = require('../../../modules/entity/views/entityView');
const userFundView = require('../../../modules/userFund/views/userFundView');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const sizeOf = require('image-size');
const path = require('path');
const config = require('../../../../config/config');
const BASE_URL = `http://${config.hostname}:${config.port}`

module.exports = (req, res, next) => {
    var ua = req.headers['user-agent'];

    if (/^(facebookexternalhit)|(Twitterbot)|(Pinterest)/gi.test(ua)) {
        return nonSPARouter(req, res, next);
    }

    next();
};

nonSPARouter.all('*', async((req, res) => {
    if (req.query.entity) {
        return handleEntity_(req, res)
    } else if (req.query.userFund) {
        return handleUserFund_(req, res)
    }
    res.render('layout', {
        url: BASE_URL,
        title: 'Сбербанк вместе',
        descriptionText: 'Начните помогать осознанно.'
    });
}));

function handleEntity_(req, res) {
    var entity = entityService.getEntity(req.query.entity, null, true, [])
    if (entity) {
        var renderedEntity = entityView.renderEntity(entity);
        var imagePath = path.join(__dirname,
            '../../../../public/uploads', entity.imgUrl);
        calculateSize_(imagePath, (err, dimensions) => {
            if (err) dimensions = {};
            return res.render('layout', {
                imageUrl: renderedEntity.imgUrl,
                imageWidth: dimensions.width,
                imageHeight: dimensions.height,
                url: `${BASE_URL}/#card?id=${req.query.entity}`,
                title: renderedEntity.title,
                descriptionText: renderedEntity.description
            });
        })
    }
}

function handleUserFund_(req, res) {
    var userFund = userFundService.getUserFund(req.query.userFund)
    if (userFund) {
        var renderedUserFund = entityView.renderUserFund(userFund);
        return res.render('layout', {
            // imageUrl: ... ,
            url: `${BASE_URL}/#card?id=${req.query.userFund}`,
            title: renderedUserFund.title,
            descriptionText: renderedUserFund.description
        });
    }
}

function calculateSize_(imagePath, cb) {
    new Promise((resolve, reject) => {
            resolve(sizeOf(imagePath))
        })
        .then(result => cb(null, result), err => cb(err))
}
