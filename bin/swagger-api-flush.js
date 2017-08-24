"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('script-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class ApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      name:       joi.string().required().regex(/^[a-z\-0-9]+$/),
      method:     joi.string().required().valid(['get', 'post', 'put', 'delete', 'patch']),
      uri:        joi.string().required(),
      type:       joi.string().optional().default('application/json; charset=utf-8'),
      service:    joi.string().optional().default(null),
      schema:     joi.array().required(),
      responses:  joi.object().optional()
    });

    this.template = handlebars.compile(TemplateStr);
  }

  run(path, runType, targets) {
    // runType in  api or page
    runType = runType || 'api';
    if (runType !== 'api' && runType !== 'page') {
      throw new Error('Only automatically generated api or page script!');
    }
    this.actionStr = this.ucFirst(runType) + 'Generator';
    this.runType = runType;
    if (runType === 'page') {
      this.template = handlebars.compile(TemplatePageStr);
    }
    debug('[' + this.actionStr+ '] Start to process '+ runType +' skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[' + this.actionStr + '] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[' + this.actionStr + '] Path specified shall be an absolute path: %s', path); return;
    }

    // load spec
    let spec = require(libPath.join(path, 'spec-swagger-api.js'));

    // validate target apis
    if (typeof targets === 'string') {
      targets = [targets];
    } else if (Array.isArray(targets)) {
      // do nothing
    } else {
      targets = [];
    }

    while (true) {
      let correspondSpec = spec.shift();
      if (!correspondSpec) {
        break;
      }

      if (targets.length > 0 && targets.indexOf(correspondSpec.name) === -1) {
        continue; // has target  & not included, skip it
      }

      this.process(path, correspondSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[' + this.actionStr + '] Processing %s ...', spec.name)).then(() => {
      return joiValidate(spec, this.schema, { allowUnknown: true });
    }).then((validatedSpec) => {
      // define api file name
      let fileNamePrefix = validatedSpec.method + "-" + validatedSpec.name;
      // get service object
      let service     = spec.service || null;
      let serviceFunc = ApiGenerator.camelCase(validatedSpec.name);
      let servicePath = "../services/" + spec.service + "/service.js";
      let serviceParams = (validatedSpec.method == 'post') ? 'this.request.body' : 'this.params';
      validatedSpec['service'] = ( service === null )
        ? ''
        : "this.body = yield require('" + servicePath + "')."+ serviceFunc +"(" + serviceParams +");";

      // enable JWT
      let enableJWT = (spec.enableJWT === null ) ? null : (spec.enableJWT || false);
      validatedSpec['checkJWT'] = (enableJWT === true)
        ?
        `
  if (api.enableJWT === true) {
    let token, parts, scheme, credentials, secret;
    if (this.header.authorization) {
      parts = this.header.authorization.split(' ');
      if (parts.length == 2) {
        scheme = parts[0];
        credentials = parts[1];
        if (/^Bearer$/i.test(scheme)) {
          token = credentials;
        }
      } else {
        this.throw(401, 'Bad Authorization header format!');
      }
    } else {
      this.throw(401, 'No Authorization header found!');
    }

    secret = require('nakedsurf').Instance.app.conf.app.jwtSecret || false;
    if (!secret) {
      this.throw(500, 'Invalid secret!');
    }

    if (require('nakedsurf').Utility.JWT.verify(token, secret) === false) {
      this.throw(401, "Invalid token!");
    }
  }
        `
        : '';

      validatedSpec['enableJWT'] = String(enableJWT);

      // api schema
      validatedSpec['schema'] = `joi.object().keys({
      `
      var len = spec.schema;
      for (var i in spec.schema) {
        if (!spec.schema.hasOwnProperty(i)) {
          continue;
        }
        var required =

        validatedSpec['schema']+= (i != 0)
          ? `,
      `
          : ``;
        validatedSpec['schema']+= spec.schema[i].name + `: joi.` + spec.schema[i].type + `().`
        validatedSpec['schema']+= (spec.schema[i].required === true) ? 'required()' : 'optional()';
      }
      validatedSpec['schema']+= `
    })`;

      // if runtype is page
      if (this.runType == 'page') {
        throw new Error(spec + 'no render schema');
      }
      // when runtype is page and type is default, change type is html
      if (this.runType == 'page' && validatedSpec.type == 'application/json; charset=utf-8') {
        validatedSpec['type'] = 'text/html; charset=utf-8';
      }
      validatedSpec['camelCaseName'] = ApiGenerator.camelCase(validatedSpec.name);

      let _this = this;
      libFsp.readFile(libPath.join(path, fileNamePrefix + '.js'), 'utf8').then(function(contents) {
        let contentsArr = contents.split("\n");
        let writeFlag = 1;
        for (var i in contentsArr) {
          if (contentsArr[i].indexOf('noCompile') > 0) {
            writeFlag = 0;
          }
        }
        if (writeFlag === 1) {
          return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.js'), _this.template(validatedSpec));
        }
      }).catch(function(err) {
        // if file not exist
        if (err.errno == -2 || err.errno == -4058) {
          return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.js'), _this.template(validatedSpec));
        }
      });
    }).catch((err) => {
      debug('[' + this.actionStr + '] Failed in processing %s: %s', spec.name, err);
    });
  }

  ucFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const TemplateStr = `'use strict';

const joi         = require('nakedsurf').Utility.joi;
const joiValidate = require('nakedsurf').Utility.joiValidate;

class {{{camelCaseName}}} {

  constructor() {
    this.method     = '{{{method}}}';
    this.uri        = '{{{uri}}}';
    this.type       = '{{{type}}}';
    this.enableJWT  = {{{enableJWT}}}; 
    this.schema     = {{{schema}}};
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
  {{{checkJWT}}}
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  try { 
    yield joiValidate(aggregatedParams, api.schema, { allowUnknown: true });
    yield next;
  } catch (err) {
    this.body = err.toString();
  }
}

function *execute(next) {
  {{{service}}}
}

const api = new {{{camelCaseName}}}();

module.exports = api;`;

const TemplatePageStr = `'use strict';

const joi         = require('nakedsurf').Utility.joi;
const joiValidate = require('nakedsurf').Utility.joiValidate;

class {{{camelCaseName}}} {

  constructor() {
    this.method     = '{{{method}}}';
    this.uri        = '{{{uri}}}';
    this.type       = '{{{type}}}';
    this.schema     = {{{schema}}};
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  yield joiValidate(aggregatedParams, page.schema, { allowUnknown: true });
  yield next;
}

function *execute(next) {
}

const page = new {{{camelCaseName}}}();

module.exports = page;`;

const generator = new ApiGenerator();

module.exports = generator;
