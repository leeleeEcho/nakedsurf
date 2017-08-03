"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

const Waterline = require('waterline');

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');

class OrmHandler {

  constructor() {
    this.waterline = new Waterline();
    this.collections = {};

    this.schema = joi.object().keys({
      path:         joi.string().required(),
      adapters:     joi.object().required(),
      connections:  joi.object().required()
    });
  }

  initialize(conf) {
    let validated = {};
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_) => {
        validated = _;
        return libFsp.stat(validated.path);
      }).then((stats) => {
        if (!stats.isDirectory()) {
          throw new Error('[OrmHandler] conf.path have to be a valid path!');
        } else if (!libPath.isAbsolute(validated.path)) {
          throw new Error('[OrmHandler] conf.path have to be an absolute path!');
        }
        return libFsp.readdir(validated.path);
      }).then((files) => {
        for (let file of files) {
          if (file === 'spec.js') {
            continue; // spec definition, skip it
          }
          let model = require(libPath.join(validated.path, file));
          this.waterline.loadCollection(Waterline.Collection.extend(model.register()));
        }
        this.waterline.initialize(validated, (err, instance) => {
          if (err) {
            reject(err);
          } else {
            this.collections = instance.collections;
            resolve();
          }
        });
      }).catch(err => reject(err));
    });
  }

  getWaterlineModel(modelName) {
    if (this.collections.hasOwnProperty(modelName)) {
      return this.collections[modelName];
    } else {
      throw new Error(`[OrmHandler] Unknown waterline model: ${modelName}`);
    }
  }

}

const orm = new OrmHandler();

module.exports = orm;