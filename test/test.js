'use strict';
const await = require('asyncawait/await');
const async = require('asyncawait/async');

const sequelize = require('../app/components/sequelize');
const entityService = require('../app/modules/fund/services/entityService');




(async(function() {
    var topic1 = await (sequelize.models.Entity.create({
        title: 'super topic1',
        type: 'Topic'
    }));
    var topic2 = await (sequelize.models.Entity.create({
        title: 'super topic2',
        type: 'Topic'
    }));
    var direction1 = await (sequelize.models.Entity.create({
        title: 'rak',
        type: 'Direction'
    }));
    var direction2 = await (sequelize.models.Entity.create({
        title: 'priyut',
        type: 'Direction'
    }));
    var fund = await (sequelize.models.Entity.create({
        title: 'super fund',
        type: 'Fund'
    }));

    await(direction1.setEntity(fund));
    await(fund.setEntity(direction1));
    console.log(await(direction1.getEntity()));
}))();
