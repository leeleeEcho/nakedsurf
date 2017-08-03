"use strict";

class ErrorHandler {

  register() {
    return function *ErrorHandler(next) {
      try {
        yield next;
      } catch(e) {
        let status = e.status || 500;
        let message = e.message || 'Internal Server Error';
        let logger  = require('../logger/Logger');
        logger.info('status: %s, message: %s', status, message);
        this.status = status;
        if (status == 500) {
          this.body = message;
          // trigger koa stack
          this.app.emit('error', e, this);
        }

        if (status == 404) {
          this.body = 'Not found';
        }
      }
    };
  }

}

const handler = new ErrorHandler();

module.exports = handler;
