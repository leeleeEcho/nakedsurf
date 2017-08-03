"use strict";

const nakedSurf = require('../index');
const config = require('./config');

const app = nakedSurf.Instance.app;

app.init(config).then(() => {
  app.start();
  app.logger.info(`Server is now running at http://${config.app.host}:${config.app.port}.`);
  app.logger.info('Server started ...');
}).catch((err) => {
  console.log(err.stack);
});