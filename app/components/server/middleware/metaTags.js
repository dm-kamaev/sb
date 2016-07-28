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

module.exports = (req, res, next) => {
    var ua = req.headers['user-agent'];

    if (/^(facebookexternalhit)|(Twitterbot)|(Pinterest)/gi.test(ua)) {
        console.log(ua, ' is a bot');
        return nonSPARouter(req, res, next);
    }

    next();
};

nonSPARouter.get('/', async((req, res) => {
    if (req.query.entity) {
        var entity = await(entityService.getEntity(req.query.entity));
        if (entity) {
            var renderedEntity = entityView.renderEntity(entity);
            var dimensions = sizeOf(path.join(__dirname,
                    '../../../../public/uploads', entity.imgUrl));
            return res.render('layout', {
                imageUrl: renderedEntity.imgUrl,
                imageWidth: dimensions.width,
                imageHeight: dimensions.height,
                url: `http://www58.lan:3000/#card?id=${req.query.entity}`,
                title: renderedEntity.title,
                descriptionText: renderedEntity.description
            });
        }
    } else if (req.query.userFund) {
        var userFund = await(userFundService.getUserFund(req.query.userFund));
        if (userFund) {
            var renderedUserFund = entityView.renderUserFund(UserFund);
            return res.render('layout', {
                // imageUrl: ... ,
                url: `http://www58.lan:3000/#card?id=${req.query.userFund}`,
                title: renderedUserFund.title,
                descriptionText: renderedUserFund.description
            });
        }
    }
    res.render('layout', {
        url: 'http://www58.lan:3000/',
        title: 'Сбербанк вместе',
        descriptionText: 'Начните помогать осознанно.'
    });
}));
