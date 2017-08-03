"use strict";

const app = require('./src/app');

module.exports = {
  Instance: {
    app:      app,
    cache:    app.cache,
    config:   app.config,
    logger:   app.logger,
    orm:      app.orm,
    router:   app.router,
    template: app.template
  },
  Bin: {
    swaggerApiGenerator:    require('./bin/swagger-api-flush'),
    swaggerDocGenerator:    require('./bin/swagger-doc-flush'),
    apiGenerator:           require('./bin/api-flush'),
    clientGenerator:        require('./bin/client-flush'),
    serverGenerator:        require('./bin/server-flush'),
    ormGenerator:           require('./bin/orm-flush'),
    ormValidationGenerator: require('./bin/orm-validaiton-flush')
  },
  Orm: {
    OrmModel: require('./src/orm/OrmModel')
  },
  Utility: {
    joi:              require('./src/utility/Joi'),
    joiValidate:      require('./src/utility/JoiValidate'),
    promisedRequest:  require('./src/utility/PromisedRequest'),
    promiseRetry:     require('./src/utility/PromiseRetry'),
    waterlineToJoi:   require('./src/utility/WaterlineToJoi'),
    underscore:       require('./src/utility/underscore'),
    JWT:              require('./src/utility/JWT')
  }
};
