"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-validation-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class OrmValidationGenerator {

  constructor() {
    this.output = '';
    this.template = handlebars.compile(TemplateStr);
  }

  run(path, outputPath) {
    debug('[OrmValidationGenerator] Start to process orm validation skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[OrmValidationGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[OrmValidationGenerator] Path specified shall be an absolute path: %s', path); return;
    } else if (!libFsp.statSync(outputPath).isDirectory()) {
      debug('[OrmValidationGenerator] OutputPath specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(outputPath)) {
      debug('[OrmValidationGenerator] OutputPath specified shall be an absolute path: %s', path); return;
    }

    // load api spec
    let spec = require(libPath.join(path, 'spec.js'));
    let params = {
      data: {}
    };

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      debug('[OrmValidationGenerator] Processing %s ...', ormSpec.name);
      params['data'][ormSpec.name] = ormSpec.schema;
    }

    libFsp.writeFile(libPath.join(outputPath, 'nakedsurf-client-orm.js'), this.template(params));
  }

}

const TemplateStr = `"use strict";

var joiValidate     = require('nakedsurf').Utility.joiValidate;
var waterlineToJoi  = require('nakedsurf').Utility.waterlineToJoi;

var Validator = function() {
  this.schema = {
    {{#each data}}
    '{{{@key}}}': waterlineToJoi({{{this}}}),
    {{/each}}
  };
};

Validator.prototype.validate = function(name, obj) {
  if (!this.schema.hasOwnProperty(name)) {
    throw new Error('Unknown model name: ' + name);
  }
  return joiValidate(obj, this.schema[name]);
};

module.exports = new Validator();`;

const generator = new OrmValidationGenerator();

module.exports = generator;
