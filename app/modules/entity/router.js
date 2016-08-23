'use strict';

const entityRouter = require('express').Router();
const multer = require('multer');
const SECRET = require('../../../config/admin-config').secret;
const path = require('path');
const errors = require('../../components/errors');
const checkQuery = require('../../components/server/middleware/checkQuery');
const checkToken = require('nodules/checkAuth').CheckToken(SECRET)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../../public/uploads/entities'));
    },
    filename: function(req, file, cb) {
        var filename = `entity-${Date.now()}.${file.mimetype.split('/')[1]}`;
        req.body.imgUrl = `entities/${filename}`;
        cb(null, filename);
    }
});
const upload = multer({
    storage
});

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.use((req, res, next) => {
    req.published = req.header('Token-Header') != SECRET ? true : { $or: [true, false] };
    // req.published = true;
    next();
});
entityRouter.use(checkQuery);
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
entityRouter.use(checkToken);

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
