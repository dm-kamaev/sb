'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
      queryInterface.dropTable('OrderItem')
  },

  down: function (queryInterface, Sequelize) {
      queryInterface.sequelize.query(`CREATE TABLE public."OrderItem" (
  id INTEGER PRIMARY KEY NOT NULL DEFAULT nextval('"OrderItem_id_seq"'::regclass),
  "entityId" INTEGER,
  "sberAcquOrderNumber" INTEGER NOT NULL,
  uncovered BOOLEAN DEFAULT true,
  title CHARACTER VARYING(255),
  description TEXT,
  type CHARACTER VARYING(255),
  "imgUrl" CHARACTER VARYING(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "deletedAt" TIMESTAMP WITH TIME ZONE,
  "parentId" INTEGER,
  "userFundId" INTEGER,
  FOREIGN KEY ("entityId") REFERENCES public."Entity" (id)
  MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
  FOREIGN KEY ("parentId") REFERENCES public."OrderItem" (id)
  MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
  FOREIGN KEY ("sberAcquOrderNumber") REFERENCES public."Order" ("sberAcquOrderNumber")
  MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION,
  FOREIGN KEY ("userFundId") REFERENCES public."UserFund" (id)
  MATCH SIMPLE ON UPDATE NO ACTION ON DELETE NO ACTION);`)
  }
};
