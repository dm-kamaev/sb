'use strict';

var nonSPARouter = require('express').Router();
var entityService = require('../../../modules/entity/services/entityService');
const userFundService =
        require('../../../modules/userFund/services/userFundService');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = (req, res, next) => {
    var ua = req.headers['user-agent'];

    if (/^(facebookexternalhit)|(Twitterbot)|(Pinterest)/gi.test(ua)) {
        console.log(ua, ' is a bot');
        return nonSPARouter(req, res, next);
    }
    
    next();
}

nonSPARouter.get('/', async((req, res) => {
    if (req.query.entity) {
        var entity = await (entityService.getEntity(req.query.entity));
        if (entity) return res.render('layout', {
            // imageUrl: ... ,
            url: `http://www58.lan:3000/#card?id=${req.query.entity}`,
            title: entity.title,
            descriptionText: entity.description
        });
    } else if (req.query.userFund) {
        var userFund = await (userFundService.getUserFund(req.query.userFund));
        if (userFund) return res.render('layout', {
            //imageUrl: ... ,
            url: `http://www58.lan:3000/#card?id=${req.query.userFund}`,
            title: userFund.title,
            descriptionText: userFund.description
        });
    }
    res.render('layout', {
        url: 'http://www58.lan:3000/',
        title: 'Сбербанк вместе',
        descriptionText: 'Начните помогать осознанно.'
    });
}));
