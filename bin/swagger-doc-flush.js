"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');
const libCp   = require('child_process');

process.env.DEBUG = '*';

const debug       = require('debug')('script-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class swaggerDocGenerator {

  run(path) {
    // runType in  api or page
    var runType = 'doc';
    this.actionStr = this.ucFirst(runType) + 'Generator';
    debug('[' + this.actionStr+ '] Start to process '+ runType +' skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[' + this.actionStr + '] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[' + this.actionStr + '] Path specified shall be an absolute path: %s', path); return;
    }

    // load spec
    let spec_info         = require(libPath.join(path, 'spec-swagger-info.js'));
    let spec_api          = require(libPath.join(path, 'spec-swagger-api.js'));
    let spec_definitions  = require(libPath.join(path, 'spec-swagger-definitions.js'));

    this.process(path, spec_info, spec_api, spec_definitions);
  }

  process(path, spec_info, spec_api, spec_definitions) {
    // define api file name
    let fileNamePrefix = 'spec-swagger';
    let json = {
      swagger: spec_info['swagger'],
      info: spec_info['info'],
      schemes: spec_info['schemes'],
      basePath: spec_info['basePath'],
      produces: spec_info['produces'],
      paths: {},
      definitions: spec_definitions
    };

    var spec;
    for (var i in spec_api) {
      if (!spec_api.hasOwnProperty(i)) {
        continue;
      }

      spec = spec_api[i];

      if (!json.paths.hasOwnProperty(spec.uri)) {
        json.paths[spec.uri] = {}
      }

      json.paths[spec.uri][spec.method] = {
        "summary": spec.name,
        "parameters": [],
        "responses": spec.responses
      };

      for (var j in spec.schema) {
        if (!spec.schema.hasOwnProperty(j)) {
          continue;
        }

        json.paths[spec.uri][spec.method].parameters.push(spec.schema[j])
      }
    }

    var _this = this;
    libFsp.readFile(libPath.join(path, fileNamePrefix + '.json'), 'utf8').then(function(contents) {
      let contentsArr = contents.split("\n");
      let writeFlag = 1;
      for (var i in contentsArr) {
        if (contentsArr[i].indexOf('noCompile') > 0) {
          writeFlag = 0;
        }
      }
      if (writeFlag === 1) {
        return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.json'), JSON.stringify(json, null, 2)).then(function () {
          _this.dumpDoc(path);
        });
      }
    }).catch(function(err) {
      // if file not exist
      if (err.errno == -2 || err.errno == -4058) {
        return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.json'), JSON.stringify(json, null, 2)).then(function () {
          _this.dumpDoc(path);
        });;
      }
    });
  }

  ucFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  dumpDoc(path) {
    var source = libPath.join(path, 'spec-swagger.json');
    var swagger2pdfPath = null;

    // ensure http-server bin path, since npm v3.x no longer support nested node_modules dir
    libCp.exec('npm bin', function(error, stdout) {
      if (error) {
        throw error;
      }
      swagger2pdfPath = libPath.join(stdout.trim(), '..', 'swagger-spec-to-pdf', 'bin', 'swagger2pdf');
    });

    var watcher = setInterval(function() {
      if (!swagger2pdfPath) {
        return;
      }
      clearInterval(watcher);

      console.log('cmd: node ' + swagger2pdfPath + ' -s ' + source + ' -o ' + path);
      libCp.exec('node ' + swagger2pdfPath + ' -s ' + source + ' -o ' + path, function(error, stdout) {
        if (error) {
          throw error;
        }
        console.log(stdout);
      });
    }, 1000); // 1s
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }
}

const generator = new swaggerDocGenerator();

module.exports = generator;
