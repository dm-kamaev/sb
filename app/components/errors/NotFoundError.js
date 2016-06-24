'use strict';

class NotFoundError extends Error {
  /**
   * @constructor
   */
    constructor() {
        super('Not found');

        this.name = 'NotFoundError';
        this.statusCode = 404;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = NotFoundError;
