'use strict';
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const util = require('util');

var Sequelize = require('sequelize');
var sequelize = new Sequelize('mydb', 'postgres', '123qwe', {
    host: 'localhost',
    dialect: 'postgres'
});

var Entity = sequelize.define('Entity', {
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
    },
    title: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.TEXT
    },
    type: {
        type: Sequelize.STRING,
        validate: {
          isIn: ['Fund', 'Topic', 'Direction']
        }
    }
}, {
    tableName: 'entity',
    unserscored: true
});


(async(function() {
    await (sequelize.sync({
        force: true
    }));
    var topic1 = await (Entity.create({
        title: 'topic1',
        description: 'this is a topic1',
        type: 'Topic'
    }));
    var topic2 = await (Entity.create({
        title: 'topic2',
        description: 'this is a topic2',
        type: 'Topic'
    }));
    var fund1 = await (Entity.create({
        title: 'fund1',
        description: 'this is a fund1',
        type: 'Fund'
    }));
    var fund2 = await (Entity.create({
        title: 'fund2',
        description: 'this is a fund2',
        type: 'Fund'
    }));
    var direction1 = await (Entity.create({
        title: 'direction1',
        description: 'this is a direction1',
        type: 'Direction'
    }));
    var direction2 = await (Entity.create({
        title: 'direction2',
        description: 'this is a direction2',
        type: 'Direction'
    }));

    await (topic1.addTopicFund(direction1));
    // await(topic1.removeTopicDirection(direction1));
    console.log(await (topic1.hasTopicDirections([direction1])));

}))();
