"use strict";

const OrmSpec = [{
    name: 'sessioninfo',
    cacheKey: 'id',
    schema: `{
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
        console.log("after create");
        cb();
      }
    }`
},];


module.exports = OrmSpec;
