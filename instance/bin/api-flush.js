process.env.DEBUG = '*';
const libPath = require('path');

const generator = require('../../index').Bin.apiGenerator;
const runType   = 'api';
const path      = libPath.join(__dirname, '..', 'app', runType);

generator.run(path, runType);