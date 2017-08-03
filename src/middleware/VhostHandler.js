"use strict";

const koaVhost  = require('koa-better-vhost');

class VhostHandler {

  register(vhosts) {
    return function *VhostHandler (next) {
       koaVhost(vhosts);
       yield next;
    };
  }

}

const handler = new VhostHandler ();

module.exports = handler;
