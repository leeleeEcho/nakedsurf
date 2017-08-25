"use strict";

const joi = require('joi');

const ApiSpec = [ {
    name:       'get-test-info',
    method:     'get',
    uri:        '/getTestInfo/:offset/:limit',
    enableJWT:  false,
    service:    'tagInfo',
    schema: `joi.object().keys({
      offset: joi.number().required(),
      limit:  joi.number().required()
    })`
},
    {
        name: 'create-test-info',
        method: 'post',
        uri: '/createTestInfo',
        enableJWT: false,
        service: 'tagInfo',
        schema: `joi.object().keys({
        name:  joi.string().required()
    })`
    },
    {
        name:       'select-test-info',
        method:     'post',
        uri:        '/queryTestInfo',
        enableJWT:  false,
        service:    'tagInfo',
        schema: `joi.object().keys({
        name:  joi.string().required()
    })`
    }

]

module.exports = ApiSpec;
