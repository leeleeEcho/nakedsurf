'use strict';

const jwt = require('koa-jwt');

function create(obj, jwtSecret, option) {
  if (jwtSecret === undefined) {
    throw new Error("undefined JWT secret");
  }

  return jwt.sign(obj, jwtSecret, option);
}

function verify(token, jwtSecret) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (e) {
    return false;
  }
}

module.exports = {
  create: create,
  verify: verify
};
