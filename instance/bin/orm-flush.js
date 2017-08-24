#!/usr/bin/env node

process.env.DEBUG = '*';
const libPath = require('path');

const generator = require('../../index').Bin.ormGenerator;
const runType   = 'orm';
const path      = libPath.join(__dirname, '..', 'app', runType);
const targetOrms= process.argv.slice(2);

generator.run(path, targetOrms);
