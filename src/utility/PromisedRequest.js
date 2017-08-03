"use strict";

const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'));

module.exports = request;