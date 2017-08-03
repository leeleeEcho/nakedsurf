"use strict";

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');

const libPath = require('path');
const libFsp  = require('fs-promise');
const libUtil = require('util');

class Config {

  constructor() {
    this.schema = joi.object().keys({
      path:   joi.string().required(),
      suffix: joi.string().optional().default('.json')
    }).required();

    this.cache = {};
  }

  initialize(conf) {
    let validated = {};
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_) => {
        validated = _;
        return libFsp.stat(validated.path);
      }).then((stats) => {
        if (!stats.isDirectory()) {
          throw new Error('[Config] conf.path have to be a valid path!');
        } else if (!libPath.isAbsolute(validated.path)) {
          throw new Error('[Config] conf.path have to be an absolute path!');
        }
        this.path   = validated.path;
        this.suffix = validated.suffix;
        resolve();
      }).catch(err => reject(err));
    });
  }

  loadKey(fileName, key, path) {
    let pathValidated = path || this.path; // optional

    this.loadJson(fileName, pathValidated).then((conf) => {
      if (conf.hasOwnProperty(key)) {
        return Promise.resolve(conf[key]);
      } else {
        return Promise.reject(new Error(libUtil.format('[Config] Key not found: %s - %s', fileName, key)));
      }
    }).catch((err) => {
      return Promise.reject(err);
    })
  }

  loadJson(fileName, path) {
    let pathValidated = path || this.path; // optional
    return new Promise((resolve, reject) => {
      // exists in cache
      if (this.cache.hasOwnProperty(fileName)) {
        resolve(this.cache[fileName]);
      }

        // check file exists
      let filePath = libPath.join(pathValidated, fileName);
      libFsp.stat(filePath).then((stats) => {
        if (!stats.isFile()) {
          reject(new Error(libUtil.format('[Config] File not found: %s', filePath)));
        }
      });

      // read & parse file
      libFsp.readFile(filePath).then((content) => {
        try {
          let jsonData = JSON.parse(content);
          this.cache[fileName] = jsonData;
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      }).catch((err) => {
        reject(err);
      });
    
    });
  }

}

const config = new Config();

module.exports = config;
