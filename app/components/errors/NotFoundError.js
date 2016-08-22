'use strict';

const i18n = require('../i18n');

class NotFoundError extends Error {
  /**
   * @constructor
   * @param {string} modelName
   * @param {Integer} id identifier of not found model
   */
    constructor(modelName, id) {
        // super(`Can't find ${modelName} with id ${id}`);
        super(i18n.__("Can't find {{modelName}} with id {{id}}", {
          modelName,
          id
        }));

        this.name = 'NotFoundError';
        this.statusCode = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = NotFoundError;
