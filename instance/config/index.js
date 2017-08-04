"use strict";
const now = new Date();
const env = process.env.NODE_ENV || 'development';

const _debug = require('debug');
const libPath = require('path');

const debug = _debug('server');
debug('Creating default configuration.');

// ========================================================
// Default Configuration
// ========================================================
const config = {
  app: {
    hostname:       'http://localhost:3039',
    host:           'localhost',
    port:           '3039',
    staticPath:     libPath.join(__dirname, '..', 'dist'),
    formLimit:      '4096',
    maxAge:         7*86400*1000, // ms
    enableJWT:      true,
    enableVhost:    true,
    enableCors:     true,
    enableRender:   false,
    jwtSecret:      '/',
    jwtPaths:       [/^\/api/],
    compressOpt: {
      threshold:    '100kb'
    },
    httpsOpt:    {
      turnOn:       false,
      port:         0,
      privateKey:   undefined,
      certificate:  undefined
    },
    errorHandle: function *(next) {
      try {
        yield next;
      } catch(e) {
        let status  = e.status || 500;
        let message = e.message || 'Internal Server Error 2';
        this.status = status;
        this.body = (status == 404) ? 'Not found page!' : message + " customer define";
      }
    }
  },
  orm: {
    path:           libPath.join(__dirname, '..', 'app', 'orm'),
    adapters: {
      memory:       require('sails-memory'),
      mongodb:      require('sails-mongo')
    },
    connections: {
      default: {
        adapter:    "memory"
      }
    }
  },
  router: [
    {
      path:   libPath.join(__dirname, '..','app', 'api'),
      apiVer: '1.0',
      prefix: '/api/1.0'
    }
  ],
  logger: {
    path:           libPath.join(__dirname, '..',  'logs', 'debug' + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + '.log'),
    level:          'verbose',
    timestamp:      true,
    showLevel:      true,
    maxsize:        1024 * 1024, // 1m
    maxFiles:       1000,
    json:           true,
    tailable:       true
  },
  cache: {
    host:           '127.0.0.1',
    port:           6370,
    family:         4,
    db:             0
  },
  config: {
    path:           __dirname
  },
  template: {

  }
};

/************************************************
 -------------------------------------------------

 All Internal Configuration Below
 Edit at Your Own Risk

 -------------------------------------------------
 ************************************************/

// ========================================================
// Environment Configuration
// ========================================================
debug(`Looking for environment overrides for NODE_ENV "${env}".`);
const environments = require('./environments');
const overrides = environments[env];
if (overrides) {
  debug('Found overrides, applying to default configuration.');
  Object.assign(config, overrides(config))
} else {
  debug('No environment overrides found, defaults will be used.')
}

module.exports = config;
