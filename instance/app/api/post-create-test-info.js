'use strict';

const joi         = require('../../../index').Utility.joi;
const joiValidate = require('../../../index').Utility.joiValidate;

class CreateTestInfo {

  constructor() {
    this.method     = 'post';
    this.uri        = '/createTestInfo';
    this.type       = 'application/json; charset=utf-8';
    this.enableJWT  = false; 
    this.schema     = joi.object().keys({
        name:  joi.string().required()
    });
  }

  register() {
    return [this.uri, validate, execute];
  }

  server(params) {
    return new Promise((resolve, reject) => {
      resolve({})
    });
  }
}

function *validate(next) {
  
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  try { 
    yield joiValidate(aggregatedParams, api.schema, { allowUnknown: true });
    yield next;
  } catch (err) {
    this.body = err.toString();
  }
}

function *execute(next) {
  this.body = yield require('../services/tagInfo/service.js').CreateTestInfo(this.request.body);
}

const api = new CreateTestInfo();

module.exports = api;