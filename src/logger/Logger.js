"use strict";

const WinstonTFile    = require('winston').transports.File;
const WinstonTConsole = require('winston').transports.Console;
const WinstonLogger   = require('winston').Logger;

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');

class Logger {

  constructor() {
    this.conf = null;
    this.instance = null;
    this.initialized = false;

    this.levels = { error: 0, warn: 1, notice: 2, info: 3, debug: 4, verbose: 5 };
    this.colors = { error: 'red', warn: 'yellow', notice: 'cyan', info: 'green', debug: 'blue', verbose: 'grey' };

    this.schema = joi.object().keys({
      level:      joi.string().required().valid(Object.keys(this.levels)),
      path:       joi.string().required(),
      timestamp:  joi.boolean().optional().default(true),
      showLevel:  joi.boolean().optional().default(true),
      maxsize:    joi.number().integer().optional().default(10 * 1024 * 1024), // 10m
      maxFiles:   joi.number().integer().optional().default(1000),
      json:       joi.boolean().optional().default(true),
      tailable:   joi.boolean().optional().default(true)
    });
  }

  initialize(conf) {
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_) => {
        this.conf = _;

        // create transports
        let fileTransport = new WinstonTFile({
          colorize:   true,
          timestamp:  this.conf.timestamp,
          showLevel:  this.conf.showLevel,
          filename:   this.conf.path,
          maxsize:    this.conf.maxsize,
          maxFiles:   this.conf.maxFiles,
          json:       this.conf.json,
          tailable:   this.conf.tailable
        });
        let consoleTransport = new WinstonTConsole({
          colorize: true,
          timestamp: this.conf.timestamp,
          showLevel: this.conf.showLevel
        });

        this.instance = new WinstonLogger({
          level: this.conf.level,
          transports: [
            fileTransport,
            consoleTransport
          ],
          levels: this.levels,
          colors: this.colors
        });

        this.initialized = true;
        resolve();
      }).catch(err => reject(err));
    });
  }

  error() {
    this.doLog('error', arguments);
  }

  warn() {
    this.doLog('warn', arguments);
  }

  notice() {
    this.doLog('notice', arguments);
  }

  info() {
    this.doLog('info', arguments);
  }

  debug() {
    this.doLog('debug', arguments);
  }

  verbose() {
    this.doLog('verbose', arguments);
  }

  /**
   * Called with first argument "this.reqId",
   * means unique session string reqId shall be added into log message.
   * The "this" in "this.reqId" is instance of koa.
   *
   * e.g logger.verbose(this.reqId, 'verbose');
   */
  doLog(level, parentArgs) {
    if (!this.initialized) {
      return; // no instance to log
    }

    let args = Array.prototype.slice.call(parentArgs);
    if (Buffer.isBuffer(args[0])) { // the first argument is "reqId"
      let reqId = args.shift().toString('base64');
      args[0] = reqId + ': ' + args[0];
    }
    this.instance[level].apply(this.instance, args);
  }

}

const logger = new Logger();

module.exports = logger;