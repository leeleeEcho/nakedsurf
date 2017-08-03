"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('server-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

const exec = require('eval');

class ServerApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      rootPath:  joi.string().required()
    });
    this.output = TemplateHead; // output client code aggregation
    this.options = {};
  }

  run(path, outputPath, options) {
    debug('[ServerApiGenerator] Start to process client api skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[ServerApiGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[ServerApiGenerator] Path specified shall be an absolute path: %s', path); return;
    } else if (!libFsp.statSync(outputPath).isDirectory()) {
      debug('[ServerApiGenerator] OutputPath specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(outputPath)) {
      debug('[ServerApiGenerator] OutputPath specified shall be an absolute path: %s', path); return;
    }

    new Promise((resolve, reject) => {
      Promise.resolve(debug('[ServerApiGenerator] Validate client generation options ...')).then(() => {
        return joiValidate(options, this.schema, { allowUnknown: true });
      }).then((validatedOptioins) => {
        this.options = validatedOptioins;
        return this.process(path);
      }).then((results) => {
        results.forEach((result) => {
          this.output += result;
        });
        libFsp.writeFile(libPath.join(outputPath, 'sagitta-server.js'), this.output + TemplateTail);
      }).then(() => {
        debug('[ServerApiGenerator] All done ...');
      }).catch((err) => {
        console.log(err.stack);
        reject(reject);
      });
    });
  }

  process(path) {
    let spec = require(libPath.join(path, 'spec.js'));
    let queue = [];

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      queue.push(this.processSingle(ormSpec));
    }

    return Promise.all(queue);
  }

  processSingle(spec) {
    debug('[ServerApiGenerator] Processing: %s', spec.name);
    return new Promise((resolve) => {
      let funcName = ServerApiGenerator.lcFirst(ServerApiGenerator.camelCase(spec.name));
      // root dir = dist dir
      let fileName = "'" + libPath.join('..', 'server', 'app', 'api', spec.method + '-' + spec.name) + "'";
      fileName = fileName.replace(/\\/g, '/');

      // parse joi schema, get params info
      let requiredParams = []; // [ paramName, ... ]
      let optionalParams = []; // [ paramName, ... ]
      let schema = exec(handlebars.compile(TemplateJoiSchema)({ schema: spec.schema }), true);
      schema._inner.children.forEach((obj) => {
        let key = obj.key;
        let isRequired = obj.schema._flags.hasOwnProperty('presence') && obj.schema._flags.presence === 'required';
        if (isRequired) {
          requiredParams.push(key);
        } else {
          optionalParams.push(key);
        }
      });

      // generate function params string
      let funcParamsStr = requiredParams.concat(optionalParams).join(', ');

      // generate aggregation params array string
      let aggParamsArray = requiredParams.concat(optionalParams);
      let aggParamsStr = (aggParamsArray.length > 0) ? "'" + aggParamsArray.join("', '") + "'" : '';
      let requiredParamsStr = (requiredParams.length > 0) ? "'" + requiredParams.join("', '") + "'" : '';

      // enable JWT
      let enableJWT = (spec.enableJWT === null ) ? null : (spec.enableJWT || false);

      // add token param
      if (enableJWT === true || enableJWT === null) {
        if (funcParamsStr != '') {
          funcParamsStr += ", token";
        } else {
          funcParamsStr = "token";
        }
        if (aggParamsStr == "''") {
          aggParamsStr  = "'token'";
        } else {
          aggParamsStr  += ", 'token'";
        }
      }

      let template = '';
      switch (spec.method) {
        case 'get':
          template = TemplateGet;
          break;
        case 'post':
          template = TemplatePost;
          break;
        case 'put':
          template = TemplatePut;
          break;
        case 'delete':
          template = TemplateDelete;
          break;
        case 'patch':
          template = TemplatePatch;
          break;
      }

      resolve(handlebars.compile(template)(Object.assign(spec, {
        funcName: funcName,
        requiredParams: requiredParams,
        requiredParamsStr: requiredParamsStr,
        optionalParams: optionalParams,
        aggParamsStr: aggParamsStr,
        funcParamsStr: funcParamsStr,
        enableJWT: String(enableJWT),
        fileName: fileName,
        baseUrl: `${this.options.protocol}://${this.options.host}/api/${this.options.apiVer}`
      }, this.options)));
    });
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

  static lcFirst(s) {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

}

const TemplateJoiSchema = `"use strict";
const joi = require('joi');
module.exports = {{{schema}}};
`;

const TemplateHead = `"use strict";
class SagittaServer {

  callFunc(options) {
    const callClass = options.callClass;
    const params = options.data;
    const res = {
      response: {},
      statusText: "",
      statusCode: 200
    };

    return new Promise((resolve, reject) => {
      if (callClass.hasOwnProperty('server')) {
        callClass.server(params)
          .then((data) => {
            res.response = data;
            resolve(res);
          })
          .catch(() => {
            res.statusCode = 500;
            reject(res);
          });
      } else {
        res.statusCode = 500;
        reject(res);
      }
    });
  }

  handleParams(params, aggParams, requiredParams) {
    let data = {};

    // replace ":param" in uri
    aggParams.forEach((key, index) => {
      const value = params[index];
      if (requiredParams.indexOf(key) >= 0 && (value === undefined)) {
        throw new Error('Param ' + key + ' is required!');
      } else if (value === undefined) {
        return;
      }

      // pass object
      data[key] = value;
    });

    return data;
  }
`;

const TemplateGet = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    const _this = this;
    const aggParams = [{{{aggParamsStr}}}];
    const requiredParams = [{{{requiredParamsStr}}}];
  
    let data = null;
    try {
      data = _this.handleParams(arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }
  
    return new Promise((resolve, reject) => {
      try {
        let api = require({{{fileName}}});
        _this.callFunc({
            callClass:    api,
            data:         data
          })
        .then((res) => resolve(res))
        .catch((err) => reject(err));    
      } catch(e) {
        reject('API:{{{funcName}}} not found!');
      }
    });
  }
`;
const TemplatePost  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
  }
`;
const TemplatePut  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
  }
`;
const TemplateDelete  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
  }
`;
const TemplatePatch   = `
  {{{funcName}}}({{{funcParamsStr}}}) {
  }
`;

const TemplateTail = `}
export default new SagittaServer();`;

const generator = new ServerApiGenerator();

module.exports = generator;
