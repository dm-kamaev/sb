'use strict';

class NotFoundError extends Error {
  /**
   * @constructor
   */
    constructor(modelName, id) {
        super(`Can't find ${modelName} with id ${id}`);

        this.name = 'NotFoundError';
        this.statusCode = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = NotFoundError;
