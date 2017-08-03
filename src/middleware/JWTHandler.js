'use strict';

const debug    = require('debug')('jwt-use');
const url      = require('url');
const thunkify = require('thunkify');
const _JWT     = require('jsonwebtoken');
const unless   = require('koa-unless');


class JWTHandler {
  /**
   * Provide a koa middleware register function
   */
  register(opts, paths) {
    opts = opts || {};
    opts.paths = paths || [];
    opts.key = opts.key || 'user';

    var middleware = function *jwt(next) {

      // 1. path is []: every router path need validate
      // 2. path is [path, ...]: only validate router path in this array
      var needJwt = true;
      var requestedUrl = url.parse((this.url) || '', true);

      if (opts.paths.length > 0) {
        needJwt = opts.paths.some(function(p) {
          return (typeof p === 'string' && p === requestedUrl.pathname) || (p instanceof RegExp && !! p.exec(requestedUrl.pathname));
        });
      }

      if (needJwt) {
        var token, msg, user, parts, scheme, credentials, secret;

        if (opts.getToken) {
          token = opts.getToken.call(this);
        } else if (opts.cookie && this.cookies.get(opts.cookie)) {
          token = this.cookies.get(opts.cookie);

        } else if (this.header.authorization) {
          parts = this.header.authorization.split(' ');
          if (parts.length == 2) {
            scheme = parts[0];
            credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
              token = credentials;
            }
          } else {
            if (!opts.passthrough) {
              this.throw(401, 'Bad Authorization header format. Format is "Authorization: Bearer <token>"\n');
            }
          }
        } else {
          if (!opts.passthrough) {
            this.throw(401, 'No Authorization header found\n');
          }
        }

        secret = (this.state && this.state.secret) ? this.state.secret : opts.secret;
        if (!secret) {
          this.throw(500, 'Invalid secret\n');
        }

        try {
          user = yield _JWT.verify(token, secret, opts);
        } catch(e) {
          msg = 'Invalid token' + (opts.debug ? ' - ' + e.message + '\n' : '\n');
        }

        if (user || opts.passthrough) {
          this.state = this.state || {};
          this.state[opts.key] = user;
          yield next;
        } else {
          this.throw(401, msg);
        }
      } else {
        yield next;
      }
    };

    middleware.unless = unless;

    return middleware;
  };

}

const instance = new JWTHandler();

module.exports = instance;
