'use strict';

// extract from directions to funds and from funds to directions
// author: dmitrii kamaev

const sequelize = require('../../../components/sequelize');
const await = require('asyncawait/await');
const async = require('asyncawait/async');
const entityTypes = require('../../entity/enums/entityTypes.js');


module.exports = class ExtractEntity {
    constructor(params) {
        this.EntityOtherEntity = sequelize.models.EntityOtherEntity;
        var rightType = false;
        Object.keys(entityTypes).forEach(key => {
            if (entityTypes[key] === params.type) { rightType = true; }
        });
        if (!rightType) {
            throw new Error('ExtractEntity => there is no such type: "'+params.type+'"');
        }
        this.type      = params.type;
        this.entityIds = params.entityIds;
    }
    extract () {
        var EntityOtherEntity = this.EntityOtherEntity,
           type      = this.type,
           entityIds = this.entityIds;
        if (type === entityTypes.DIRECTION) {
            var query = {
                where: {
                    entityId: {
                        $in: entityIds
                    }
                }
            };
            var funds = await(EntityOtherEntity.findAll(query)) || [];
            // console.log(funds);
            return funds.map(fund => fund.otherEntityId);
        }
    }
};