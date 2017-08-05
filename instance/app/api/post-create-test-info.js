'use strict';

const joi         = require('../../../index').Utility.joi;
const joiValidate = require('../../../index').Utility.joiValidate;

class CreateTestInfo {

  constructor() {
    this.method     = 'post';
    this.uri        = '/createTestInfo';
    this.type       = 'application/json; charset=utf-8';
    this.enableJWT  = false;
    this.schema     = joi.object().keys({
        name:  joi.string().required()
    });
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

  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  try { 
    yield joiValidate(aggregatedParams, api.schema, { allowUnknown: true });
    yield next;
  } catch (err) {
    this.body = err.toString();
  }
}

function *execute(next) {

    const md5  = require("js-md5");
    const sessionInfoModel = require("../orm/sessionifo-model").instance;
    let _this = this;
    this.body = yield new Promise(function(resolve) {resolve(true)})
        .then(function () {
            return createViaModel(sessionInfoModel, { sessionid: md5('leelee.echo')}).then((res) => {
                _this.info = res;
            }, (err) => {
                _this.err_code = err.status;
                _this.err = err;
            } );
        })
        .then(function () {
            return createViaModel(sessionInfoModel, { sessionid: md5('leelee.echo')}).then((res) => {
                _this.info = res;
            }, (err) => {
                _this.err_code = err.status;
                _this.err = err;
            } );
        })
        .then(function () {
            return createViaModel(sessionInfoModel, { sessionid: md5('leelee.echo')}).then((res) => {
                _this.info = res;
            }, (err) => {
                _this.err_code = err.status;
                _this.err = err;
            } );
        })
        .then((_) => {
            return {result:  _this.info};
        })

}

    // new Promise(function(resolve) {
    //     _this.initInfo()
    //         .then(function () {
    //             const condition = modelTool.createConditionObject(
    //                 ['id','name','token','expired_time'],
    //                 {
    //                     token: params.bktoken,
    //                 }
    //             );
    //             return _this.findViaModel(adminUserModel, condition).then((res) => {
    //                 _this.userInfo = res;
    //             });
    //         })
    //         .then(function () {
    //
    //             if (_this.userInfo.length && _this.userInfo[0].token && params.bktoken == _this.userInfo[0].token &&
    //                 util.getTimeStamp() - _this.userInfo[0].expired_time <  3600
    //             ) {
    //                 _this.tokenValid = 1;
    //             }
    //             return _this.initInfo();
    //         })
    //         .then(function () {
    //             resolve({
    //                 // updateRet: _this.updateRet,
    //                 userInfo: _this.userInfo,
    //                 tokenValid: _this.tokenValid,
    //             });
    //         });
    //
    //
    // this.body = ;
// }

function createViaModel(model, insertValue) {
    return new Promise(function (resolve,reject) {
            model.create(insertValue)
            .then(function(res) {
                resolve(res);
            })
            .catch(function(err){
                reject(err);
            });
    });
}


const api = new CreateTestInfo();

module.exports = api;