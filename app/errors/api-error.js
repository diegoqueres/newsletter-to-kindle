const HttpStatus = require('./http-status');

class APIError extends Error {
    constructor(name, httpCode = HttpStatus.INTERNAL_SERVER, description = 'internal server error') {
      super(description);
      Object.setPrototypeOf(this, new.target.prototype);
    
      this.name = name;
      this.description = description;
      this.httpCode = httpCode;
      Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = APIError;