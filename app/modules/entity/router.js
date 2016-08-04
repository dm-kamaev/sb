'use strict';

const entityRouter = require('express').Router();
const multer = require('multer');
const path = require('path');
const errors = require('../../components/errors');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../../public/uploads/entity_pics'));
    },
    filename: function(req, file, cb) {
        var filename = `entity-${Date.now()}.${file.mimetype.split('/')[1]}`;
        req.body.imgUrl = `entity_pics/${filename}`;
        cb(null, filename);
    }
});
const upload = multer({
    storage
});

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.use((req, res, next) => {
    // req.published = token ? true : { $or: [true, false] };
    req.published = true;
    next();
});

entityRouter.get('/',
    entityController.actionGetAllEntities);
entityRouter.get('/:type(topic|direction|fund)',
    entityController.actionGetEntitiesByType);
entityRouter.get('/:id(\\d+)',
    entityController.actionGetEntity);
entityRouter.get('/:id(\\d+)/:type(topic|direction|fund)',
    entityController.actionGetEntitiesByAssociatedId);
entityRouter.get('/fund/today',
    entityController.actionGetTodayFundsCount);
entityRouter.get('/:id(\\d+)/user-fund',
    entityController.actionGetUserFunds);
entityRouter.post('/publishall',
    entityController.actionPublishAll);

// admin routes
entityRouter.use((req, res, next) => {
    // check auth here
    next();
});
entityRouter.use((req, res, next) => {
    var include = req.query.include || [];
    var type = req.query.type || [];
    if (!Array.isArray(include)) include = [include];
    if (!Array.isArray(type)) type = [type];
    req.include = include
        .filter(e => e == 'fund' || e == 'topic' || e == 'direction');
    req.type = type
        .filter(e => e == 'fund' || e == 'topic' || e == 'direction');
    next();
});
entityRouter.get('/all',
    entityController.actionGetEntitiesWithNested);
entityRouter.post('/', upload.single('picture'),
    entityController.actionCreateEntity);
entityRouter.put('/:id(\\d+)', upload.single('picture'),
    entityController.actionUpdateEntity);
entityRouter.delete('/:id(\\d+)',
    entityController.actionDeleteEntity);
entityRouter.post('/:id(\\d+)/:otherId(\\d+)',
    entityController.actionAssociate);
entityRouter.delete('/:id(\\d+)/:otherId(\\d+)',
    entityController.actionRemoveAssociation);


module.exports = entityRouter;
