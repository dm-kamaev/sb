'use strict';

const i18n = require('../i18n');

class NotFoundError extends Error {
  /**
   * @constructor
   * @param {string} modelName
   * @param {Integer} id identifier of not found model
   */
    constructor() {
        if (arguments.length === 2) {
          var modelName = arguments[0], id = arguments[1];
          super(i18n.__('Can\'t find {{modelName}} with id {{id}}', {
              modelName,
              id
          }));
        } else {
          super(arguments[0]);
        }

        this.name       = 'NotFoundError';
        this.statusCode = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = NotFoundError;
