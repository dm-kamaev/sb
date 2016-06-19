'use strict';
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const util = require('util');

var Sequelize = require('sequelize');
var sequelize = new Sequelize('mydb', 'postgres', '123456', {
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
        type: Sequelize.ENUM('Fund', 'Topic', 'Direction')
    }
}, {
    tableName: 'entity',
    unserscored: true
});
//fund
Entity.belongsToMany(Entity, {
    as: 'FundTopic',
    through: 'fundId_topicId',
    foreignKey: 'fund_id',
    otherKey: 'topic_id'
});
//fund
Entity.belongsToMany(Entity, {
    as: 'FundDirection',
    through: 'fundId_directionId',
    foreignKey: 'fund_id',
    otherKey: 'topic_id'
});
//topic
Entity.belongsToMany(Entity, {
    //TODO: correct name?
    as: 'TopicDirection',
    through: 'topicId_directionId',
    foreignKey: 'topic_id',
    otherKey: 'direction_id'
});
//topic
Entity.belongsToMany(Entity, {
    as: 'TopicFund',
    through: 'fundId_topicId',
    foreignKey: 'topic_id',
    otherKey: 'fund_id'
});
//direction
Entity.belongsToMany(Entity, {
    as: 'DirectionTopic',
    through: 'topicId_directionId',
    foreignKey: 'direction_id',
    otherKey: 'topic_id'
});
//direction
Entity.belongsToMany(Entity, {
    as: 'DirectionFund',
    through: 'fundId_directionId',
    foreignKey: 'direction_id',
    otherKey: 'fund_id'
});

(async(function () {
    await(sequelize.sync({force: true}))
    var topic1 = await(Entity.create({
        title: 'topic1',
        description: 'this is a topic1',
        type: 'Topic'
    }));
    var topic2 = await(Entity.create({
        title: 'topic2',
        description: 'this is a topic2',
        type: 'Topic'
    }));
    var fund1 = await(Entity.create({
        title: 'fund1',
        description: 'this is a fund1',
        type: 'Fund'
    }));
    var fund2 = await(Entity.create({
        title: 'fund2',
        description: 'this is a fund2',
        type: 'Fund'
    }));
    var direction1 = await(Entity.create({
        title: 'direction1',
        description: 'this is a direction1',
        type: 'Direction'
    }));
    var direction2 = await(Entity.create({
        title: 'direction2',
        description: 'this is a direction2',
        type: 'Direction'
    }));

    await(topic1.setTopicFund(fund1));
    var ftopic = await(fund1.getFundTopic());
    // console.log(ftopic);
    console.log(ftopic[0].id)
    await(Entity.destroy({
        where: {
            id: ftopic[0].id
        }
    }));

    var ftopic2 = await(fund1.getFundTopic());
     console.log(ftopic2);

}))();
