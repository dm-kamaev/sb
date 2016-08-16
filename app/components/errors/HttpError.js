'use strict';

class NotFoundError extends Error {
  /**
   * @constructor
   * @param {string} message
   * @param {Integer} statusCode
   */
    constructor(message, statusCode) {
        super(message);

        this.name = 'HttpError';
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = NotFoundError;
