"use strict";

const logger = require('../logger/Logger');

class NotFoundHandler {

  register() {
    return function *NotFoundHandler(next) {
      yield next;
      if (404 != this.status) {
        return;
      }

      this.status = 404;

      switch (this.accepts('html', 'json')) {
        case 'html':
          this.type = 'html';
          this.body = '<html><body><h4>404</h4></body></html>';
          break;
        case 'json':
          this.body = {
            message: 'Page Not Found'
          };
          break;
        default:
          this.type = 'text';
          this.body = 'Page Not Found';
      }

      logger.warn('%s %s 404 Not found', this.method, this.url);
    };
  }

}

const handler = new NotFoundHandler();

module.exports = handler;