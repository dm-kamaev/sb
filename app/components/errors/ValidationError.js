'use strict';

class ValidationError extends Error {
  constructor(validationErrors){
    super('Validation Error');

    this.name = 'ValidationError';
    this.statusCode = 400;
    this.validationErrors = validationErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ValidationError;
