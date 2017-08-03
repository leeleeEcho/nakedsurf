"use strict";

const Redis = require('ioredis');

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');
const msgpack     = require('msgpack-lite');

class Cache {

  constructor() {
    this.instance = null;

    this.schema = joi.object().keys({
      host:     joi.string().ip().optional().default('127.0.0.1'),
      port:     joi.number().integer().optional().default(6379),
      family:   joi.number().integer().optional().valid([4, 6]).default(4),
      password: joi.string().optional(),
      db:       joi.number().integer().optional().default(0)
    }).optional();

    this.variance = 10;
    this.expires = 18000; // 5 hours = 5 * 60 * 60 seconds
  }

  initialize(conf) {
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((validated) => {
        this.instance = new Redis(validated);
        resolve();
      }).catch(err => reject(err));
    });
  }

  setModelHash(modelName, identity, queryString, data, expires) {
    let key = Cache.genModelKey(modelName, identity);
    return new Promise((resolve, reject) => {
      this.instance.pipeline()
        .hset(key, queryString, msgpack.encode(data))
        .expire(key, this.genExpire(expires))
        .exec()
        .then((results) => { // results: [[null, 1], [null, 1]]
          results.forEach((result) => { // result: [null, 1]
            if (result[0]) {
              reject(result[0]); // err
            }
          });
          resolve(data); // data itself resolved
        });
    });
  }

  getModelHash(modelName, identity, queryString) {
    return new Promise((resolve, reject) => {
      this.instance.hgetBuffer(Cache.genModelKey(modelName, identity), queryString).then((data) => {
        if (data !== null) {
            data = msgpack.decode(data);
        }
        resolve(data);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  removeModelHash(modelName, identity) {
    return this.instance.del(Cache.genModelKey(modelName, identity));
  }

  setExpire(key, expires) {
    return this.instance.expire(key, this.genExpire(expires));
  }

  static genModelKey(modelName, identity) {
    return `${modelName}:${identity}`;
  }

  genExpire(expires) {
    expires = expires || this.expires;

    let varianceMin = 0;
    let varianceMax = expires * 0.02 * this.variance;
    let varianceMinus = expires * 0.01 * this.variance;

    return Math.floor(expires + Cache.getRandomArbitrary(varianceMin, varianceMax) - varianceMinus);
  }

  static getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

}

const cache = new Cache();

module.exports = cache;
