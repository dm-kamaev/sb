'use strict';

const entityRouter = require('express').Router();
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../../../public/uploads/entity_pics'))
    },
    filename: function(req, file, cb) {
        var filename = `entity-${Date.now()}.${file.mimetype.split('/')[1]}`;
        req.body.imgUrl = `entity_pics/${filename}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

var EntityController = require('./controllers/EntityController');
var entityController = new EntityController();

entityRouter.get('/', entityController.actionGetAllEntities);
entityRouter.get('/:type(topic|direction|fund)', entityController.actionGetEntitiesByType);
entityRouter.get('/:id(\\d+)', entityController.actionGetEntity);
entityRouter.post('/', upload.single('picture'), entityController.actionCreateEntity);
entityRouter.put('/:id(\\d+)', upload.single('picture'), entityController.actionUpdateEntity);
entityRouter.delete('/:id(\\d+)', entityController.actionDeleteEntity);
entityRouter.get('/:id(\\d+)/:type(topic|direction|fund)', entityController.actionGetEntitiesByAssociatedId);
entityRouter.post('/:id(\\d+)/:otherId(\\d+)', entityController.actionAssociate);
entityRouter.delete('/:id(\\d+)/:otherId(\\d+)', entityController.actionRemoveAssociation);
entityRouter.get('/fund/today', entityController.actionGetTodayFundsCount);
entityRouter.get('/:id(\\d+)/user-fund', entityController.actionGetUserFunds);

module.exports = entityRouter;
