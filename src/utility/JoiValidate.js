"use strict";

const joi       = require('joi');
const bluebird  = require('bluebird');

module.exports = bluebird.promisify(joi.validate);