"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

const exec = require('eval');

class ClientApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      host:      joi.string().required(),
      apiVer:    joi.string().required(),
      protocol:  joi.string().optional().valid(['http', 'https']).default('http'),
      timeout:   joi.number().integer().optional().default(5000) // 5s
    });
    this.output = ''; // output client code aggregation
    this.options = {};
  }

  run(path, outputPath, options) {
    debug('[ClientApiGenerator] Start to process client api skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[ClientApiGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[ClientApiGenerator] Path specified shall be an absolute path: %s', path); return;
    } else if (!libFsp.statSync(outputPath).isDirectory()) {
      debug('[ClientApiGenerator] OutputPath specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(outputPath)) {
      debug('[ClientApiGenerator] OutputPath specified shall be an absolute path: %s', path); return;
    }

    new Promise((resolve, reject) => {
      Promise.resolve(debug('[ClientApiGenerator] Validate client generation options ...')).then(() => {
        this.output = handlebars.compile(TemplateHead)({
          apiHost: `${options.protocol}://${options.host}/`
        });
        return joiValidate(options, this.schema, { allowUnknown: true });
      }).then((validatedOptioins) => {
        this.options = validatedOptioins;
        return this.process(path);
      }).then((results) => {
        results.forEach((result) => {
          this.output += result;
        });
        libFsp.writeFile(libPath.join(outputPath, 'sagitta-client.js'), this.output + TemplateTail);
      }).then(() => {
        debug('[ClientApiGenerator] All done ...');
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
    debug('[ClientApiGenerator] Processing: %s', spec.name);
    return new Promise((resolve) => {
      let funcName = ClientApiGenerator.lcFirst(ClientApiGenerator.camelCase(spec.name));

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
        baseUrl: `api/${this.options.apiVer}`
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
import Configs from "../../common/Configs";
let apiHost = Configs.DEFAULT.SERVER.API_HOST;

class SagittaClient {

  ajax (options) {
    options = options || {};
    options.type = (options.type || 'GET').toUpperCase();
    options.dataType = (options.dataType || 'json'). toLowerCase();

    const buildParam = (condition) => {
      let data = null;
      if (condition != null) {
        if (typeof condition == 'string') {
          data = condition;
        }
        if (typeof condition == 'object') {
          let arr = [];
          for (let dname in condition) {
            let dvalue = condition[dname];
            arr.push(encodeURIComponent(dname) + '=' + encodeURIComponent(dvalue));
          }
          data = arr.join('&');
        }
      }
      return data;
    };

    let url = options.url;
    let token;
    if (options.enableJWT === true && options.data.token) {
      token = options.data.token;
      delete options.data.token;
    }
    if (options.enableJWT === true && token == undefined) {
      return Promise.reject("token is missing");
    }

    let xhr;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else {
      xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }

    let params = buildParam(options.data);
    let res;
    return new Promise((resolve, reject) => {
      if (options.type == 'GET' || options.type == 'DELETE') {
        if (params !== null) {
          url = url + '?' + params;
        }
        xhr.open(options.type, url, true);
      } else if (options.type == 'POST' || options.type == 'PUT' || options.type == 'PATCH') {
        xhr.open(options.type, url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }
      // enable jwt
      if (token) {
        xhr.setRequestHeader("Authorization", "Bearer " + token);
      }
      xhr.send(params);

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          let status = xhr.status;
          let response = xhr.responseText;
          if (status >= 200 && status < 300) {
            if (options.dataType == 'json') {
              response = JSON.parse(response);
            } else if (options.dataType == 'xml') {
              response = xhr.responseXML;
            }
            res = { response: response, statusText: xhr.statusText, statusCode: xhr.status };
            resolve(res);
          } else {
            reject(response);
          }
        }
      }

    });
  }

  handleParams(uri, params, aggParams, requiredParams) {
    let data = {};

    // replace ":param" in uri
    aggParams.forEach((key, index) => {
      const value = params[index];
      let hasQueryParam = (uri.match(':' + key) !== null);
      if (requiredParams.indexOf(key) >= 0 && ((hasQueryParam && value === '') || value === undefined)) {
        throw new Error('Param ' + key + ' is required!');
      } else if (value === undefined) {
        return;
      }

      // if in uri
      if (hasQueryParam) {
        uri = uri.replace(':' + key, value);
      } else {
        data[key] = value;
      }
    });

    return { uri: uri, data: data };
  }
`;
const TemplateGet = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    let _this = this;
    let uri = '{{{uri}}}';
    let aggParams = [{{{aggParamsStr}}}];
    let requiredParams = [{{{requiredParamsStr}}}];

    let data = null;
    try {
      data = _this.handleParams(uri, arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }

    let url = apiHost + '{{{baseUrl}}}' + data.uri;
    return new Promise((resolve, reject) => {
      _this.ajax({
        url:        url,
        type:       'GET',
        timeout:    {{{timeout}}},
        enableJWT:  {{{enableJWT}}},
        data:       data.data
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
`;
const TemplatePost  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    let _this = this;
    let uri = '{{{uri}}}';
    let aggParams = [{{{aggParamsStr}}}];
    let requiredParams = [{{{requiredParamsStr}}}];

    let data = null;
    try {
      data = _this.handleParams(uri, arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }

    let url = apiHost + '{{{baseUrl}}}' + data.uri;
    return new Promise((resolve, reject) => {
      _this.ajax({
        url:        url,
        type:       'POST',
        timeout:    {{{timeout}}},
        enableJWT:  {{{enableJWT}}},
        data:       data.data
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
`;
const TemplatePut  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    let _this = this;
    let uri = '{{{uri}}}';
    let aggParams = [{{{aggParamsStr}}}];
    let requiredParams = [{{{requiredParamsStr}}}];

    let data = null;
    try {
      data = _this.handleParams(uri, arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }

    let url = apiHost + '{{{baseUrl}}}' + data.uri;
    return new Promise((resolve, reject) => {
      _this.ajax({
        url:        url,
        type:       'PUT',
        timeout:    {{{timeout}}},
        enableJWT:  {{{enableJWT}}},
        data:       data.data
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
`;
const TemplateDelete  = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    let _this = this;
    let uri = '{{{uri}}}';
    let aggParams = [{{{aggParamsStr}}}];
    let requiredParams = [{{{requiredParamsStr}}}];

    let data = null;
    try {
      data = _this.handleParams(uri, arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }

    let url = apiHost + '{{{baseUrl}}}' + data.uri;
    return new Promise((resolve, reject) => {
      _this.ajax({
        url:        url,
        type:       'DELETE',
        timeout:    {{{timeout}}},
        enableJWT:  {{{enableJWT}}},
        data:       data.data
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
`;
const TemplatePatch   = `
  {{{funcName}}}({{{funcParamsStr}}}) {
    let _this = this;
    let uri = '{{{uri}}}';
    let aggParams = [{{{aggParamsStr}}}];
    let requiredParams = [{{{requiredParamsStr}}}];

    let data = null;
    try {
      data = _this.handleParams(uri, arguments, aggParams, requiredParams)
    } catch (err) {
      return Promise.reject(err);
    }

    let formData = data.data;
    if (arguments.length == 2 && typeof arguments[1] === 'object') {
      formData = arguments[1];
    }

    let url = apiHost + '{{{baseUrl}}}' + data.uri;
    return new Promise((resolve, reject) => {
      _this.ajax({
        url:        url,
        type:       'PATCH',
        timeout:    {{{timeout}}},
        enableJWT:  {{{enableJWT}}},
        data:       formData
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
`;

const TemplateTail = `}
export default new SagittaClient();`;

const generator = new ClientApiGenerator();

module.exports = generator;
