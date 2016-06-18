'use strict';
const await = require('asyncawait/await');
const async = require('asyncawait/async');

const sequelize = require('../app/components/sequelize');
// sequelize.sync({force: true});
// console.log(sequelize.sequelize_)




(async(function(){
  sequelize.sequelize_.sync({force: true});
  var entity1 = await(sequelize.models.Entity.findOrCreate({
    where: {
      title: '111',
      description: '1111wwww'
    }
  }));
  sequelize.sequelize_.sync({force: true});
  var entity2 = await(sequelize.models.Entity.findOrCreate({
    where: {
      title: '222',
      description: '2222wwww'
    }
  }));
  // console.log(entity1);
}))();
