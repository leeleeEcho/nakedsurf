"use strict";

const OrmModel = require('../../../index').Orm.OrmModel;

class SessionifoModel extends OrmModel {

  constructor() {
    super();
    this.name        = 'sessioninfo';
    this.cacheKey    = 'id';
    this.schema      = {
      migrate: 'safe',
      identity: 'sessioninfo',
      connection: 'mysql',
      attributes: {
        id: {
            type: 'integer',
            primaryKey: true,
            unique: true
          },
        sessionid:{
          type: 'string',
          notEmpty: true,
          unique: true
        }
      },
      autoPK: false,
      autoCreatedAt: true,
      afterCreate: function(values, cb) {
      //  console.log("after create");
        cb();
      }
    };
  }
  
  afterCreate(createdValues, next) {
    OrmModel.removeCacheAfterRecordChanged('sessionifo', 'id', createdValues, next);
  }

  afterUpdate(updatedRecord, next) {
    OrmModel.removeCacheAfterRecordChanged('sessionifo', 'id', updatedRecord, next);
  }

  afterDestroy(deletedRecord, next) {
    OrmModel.removeCacheAfterRecordChanged('sessionifo', 'id', deletedRecord, next);
  }

}

const model = new SessionifoModel();

module.exports = model;