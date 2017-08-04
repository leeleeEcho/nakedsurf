// Here is where you can define configuration overrides based on the execution environment.
// Supply a key to the default export matching the NODE_ENV that you wish to target, and
// the base configuration will apply your overrides before exporting itself.
"use strict";

const libPath = require('path');
const objectAssign = require('object-assign');

const apiConfig   = require('./nakedsurf-api');

module.exports = {
  // ======================================================
  // Overrides when NODE_ENV === 'development'
  // ======================================================
  development: (config) => ({
    app: objectAssign({}, config.app, {
      hostname:       `http://${apiConfig.development.domain}/`,
      host:           apiConfig.development.host,
      port:           apiConfig.development.port,
      enableJWT:      false,
      enableVhost:    true,
      enableCors:     true,
      jwtSecret:      'fengjie',
      httpsOpt: {
        turnOn:       true,
        port:         8081,
        privateKey:   libPath.join(__dirname, 'security/certs/ssl/server.key'),
        certificate:  libPath.join(__dirname, 'security/certs/ssl/pub.crt')
      }
    }),
    router: [
      {
        path:         libPath.join(__dirname, '..','app', 'api'),
        apiVer:       apiConfig.development.apiVer,
        prefix:       '/api/' +  apiConfig.development.apiVer
      }
    ],
    orm: objectAssign({}, config.orm, {
      connections: {
        default: {
          adapter:    "memory"
        },
        mongo: {
          adapter:    "mongodb",
          host:       "127.0.0.1",
          port:       27017,
          database:   "db-om-shinezone"
        }
      }
    })
    // config: {
    //   path:           libPath.join(__dirname, 'dev') // json 配置地址
    // }
  }),

  // ======================================================
  // Overrides when NODE_ENV === 'production'
  // ======================================================
  production: (config) => ({
    app: objectAssign({}, config.app, {
      hostname:       `http://${apiConfig.production.domain}/`,
      host:           apiConfig.production.host,
      port:           apiConfig.production.port,
      enableJWT:      false,
      enableVhost:    true,
      enableCors:     true,
      jwtSecret:      'fengjie'
    }),
    router: [
      {
        path:         libPath.join(__dirname, '..','app', 'api'),
        apiVer:       apiConfig.production.apiVer,
        prefix:       '/api/' +  apiConfig.production.apiVer
      }
    ],
     orm: objectAssign({}, config.orm, {
      connections: {
        default: {
          adapter:    "memory"
        },
        mongo: {
          adapter:    "mongodb",
          host:       "127.0.0.1",
          port:       27017,
          database:   "db-om-shinezone"
        }
        // mongo: {
        //   adapter:    "mongodb",
        //   host:       "127.0.0.1",
        //   port:       27017,
        //   database:   "pay-shinezone"
        // }
      }

    })
    // config: {
    //   path:           libPath.join(__dirname, 'prod') // json 配置地址
    // }
  }),
  // ======================================================
  // Overrides when NODE_ENV === 'preview'
  // ======================================================
  preview: (config) => ({
    app: objectAssign({}, config.app, {
      hostname:       `http://${apiConfig.preview.domain}/`,
      host:           apiConfig.preview.host,
      port:           apiConfig.preview.port,
      staticPath:     libPath.join(__dirname, '..', '..', 'dist', 'preview'),
      enableJWT:      false,
      enableVhost:    true,
      enableCors:     true,
      jwtSecret:      'fengjie'
    }),
    router: [
      {
        path:         libPath.join(__dirname, '..','app', 'api'),
        apiVer:       apiConfig.preview.apiVer,
        prefix:       '/api/' +  apiConfig.preview.apiVer
      }
    ],
    orm: objectAssign({}, config.orm, {
      connections: {
        default: {
          adapter:    "memory"
        },
        mongo: {
          adapter:    "mongodb",
          host:       "127.0.0.1",
          port:       27017,
          database:   "db-om-shinezone"
        }
        // mongo: {
        //   adapter:    "mongodb",
        //   host:       "127.0.0.1",
        //   port:       27017,
        //   database:   "pay-shinezone"
        // }
      }

    })
    // config: {
    //   path:           libPath.join(__dirname, 'prod') // json 配置地址
    // }
  })

  // production: (config) => ({
  //   app: objectAssign({}, config.app, {
  //     hostname:       `http://${apiConfig.production.domain}/`,
  //     host:           apiConfig.production.host,
  //     port:           apiConfig.production.port,
  //     enableJWT:      false,
  //     enableVhost:    true,
  //     enableCors:     true,
  //     jwtSecret:      'fengjie'
  //   }),
  //   router: [
  //     {
  //       path:         libPath.join(__dirname, '..','app', 'api'),
  //       apiVer:       apiConfig.production.apiVer,
  //       prefix:       '/api/' + apiConfig.production.apiVer
  //     }
  //   ],
  //   orm: objectAssign({}, config.orm, {
  //     connections: {
  //       default: {
  //         adapter:    "memory"
  //       },
  //       mongodb0: {
  //         adapter:    "mongodb",
  //         host:       "127.0.0.1",
  //         port:       27017,
  //         database:   "web_db"
  //       },
  //       mongodb1: {
  //         adapter:    "mongodb",
  //         host:       "127.0.0.1",
  //         port:       27018,
  //         database:   "web_db"
  //       }
  //     }
  //   }),
  //   config: {
  //     path:           libPath.join(__dirname, 'prod')
  //   }
  // })
};
