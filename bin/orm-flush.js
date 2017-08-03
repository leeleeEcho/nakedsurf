"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class OrmGenerator {

  constructor() {
    this.schema = joi.object().keys({
      name:     joi.string().required(),
      cacheKey: joi.string().required(),
      schema:   joi.string().required()
    });

    this.template = handlebars.compile(TemplateStr);
  }

  run(path, targetOrms) {
    debug('[OrmGenerator] Start to process orm skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[OrmGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[OrmGenerator] Path specified shall be an absolute path: %s', path); return;
    }

    // load api spec
    let spec = require(libPath.join(path, 'spec.js'));

    // validate target apis
    if (typeof targetOrms === 'string') {
      targetOrms = [targetOrms];
    } else if (Array.isArray(targetOrms)) {
      // do nothing
    } else {
      targetOrms = [];
    }

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      if (targetOrms.length > 0 && targetOrms.indexOf(ormSpec.name) === -1) {
        continue; // has target orms & not included, skip it
      }

      this.process(path, ormSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[OrmGenerator] Processing %s ...', spec.name)).then(() => {
      return joiValidate(spec, this.schema, { allowUnknown: true });
    }).then((validatedSpec) => {
      validatedSpec['camelCaseName'] = OrmGenerator.camelCase(validatedSpec.name);
      return libFsp.writeFile(libPath.join(path, validatedSpec.name + '-model.js'), this.template(validatedSpec));
    }).catch((err) => {
      debug('[OrmGenerator] Failed in processing %s: %j', spec.name, err);
    });
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const TemplateStr = `"use strict";

const OrmModel = require('sagitta').Orm.OrmModel;

class {{{camelCaseName}}}Model extends OrmModel {

  constructor() {
    super();
    this.name        = '{{{name}}}';
    this.cacheKey    = '{{{cacheKey}}}';
    this.schema      = {{{schema}}};
  }
  
  afterCreate(createdValues, next) {
    OrmModel.removeCacheAfterRecordChanged('{{{name}}}', '{{{cacheKey}}}', createdValues, next);
  }

  afterUpdate(updatedRecord, next) {
    OrmModel.removeCacheAfterRecordChanged('{{{name}}}', '{{{cacheKey}}}', updatedRecord, next);
  }

  afterDestroy(deletedRecord, next) {
    OrmModel.removeCacheAfterRecordChanged('{{{name}}}', '{{{cacheKey}}}', deletedRecord, next);
  }

}

const model = new {{{camelCaseName}}}Model();

module.exports = model;`;

const generator = new OrmGenerator();

module.exports = generator;
