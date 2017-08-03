'use strict';
var Promise = require("bluebird");
var Joi = require("joi");
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const crypto = require('crypto');
const md5 = require('js-md5');
const moment = require('moment');
const zlib = require('zlib');

function mergeObject(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}



function readJson(fileName) {
    let jsonFile = require('jsonfile');
    return jsonFile.readFileSync(__dirname + fileName);
}

function writeJson(fileName,obj,_opt) {
    let jsonFile = require('jsonfile');
    let option  = _opt ? _opt : {};
    return jsonFile.writeFileSync(__dirname+fileName, obj, option);
}

function sendMail(name,mail,title,content) {
    var nodemailer = require("nodemailer");
    var smtpTransport = require("nodemailer-smtp-transport");

    let mailOptions = {
        from: "",
        to: "",
        subject: title,
        html: ""
    };

    // 发送邮件
    nodemailer.createTransport(smtpTransport({
        host: "smtp.exmail.qq.com",
        secureConnection: false,
        port: 465,
        auth: {
            user: "business@shinezone.com",
            pass: "Shinezone2016"
        }
    })).sendMail(mailOptions, function(error, response) {
        if (error) {
            return false;
        } else {
            smtpTransport.close();
            return true;
        }
    });
}







// check JWT
function checkJWT(ctx) {

    let token, parts, scheme, credentials;
    if (ctx.header.authorization) {
        parts = ctx.header.authorization.split(' ');
        if (parts.length == 2) {
            scheme = parts[0];
            credentials = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            }
        } else {
            ctx.throw(401, 'Bad Authorization header format!');
        }
    } else {
        ctx.throw(401, 'No Authorization header found!');
    }

    let jwtSecret = require('sagitta').Instance.app.conf.app.jwtSecret || undefined;
    let decodeToken = require('sagitta').Utility.JWT.verify(token, jwtSecret);
    if (decodeToken === false) {
        ctx.throw(401, 'JWT verify is false!');
    }
    if ((ctx.params.userId !== undefined && decodeToken.userId != ctx.params.userId)
        || (ctx.request.body.userId !== undefined && decodeToken.userId != ctx.request.body.userId)) {
        ctx.throw(401 , 'No Authorization userId:' + decodeToken.userId + "!");
    }
    return decodeToken;
}




function getImageBase64(origin){
    let fs = require('fs');
    let path = require('path');
    return fs.readFileSync(path.join(__dirname, origin)).toString('base64');
}




function encodeRFC5987ValueChars (str) {
    return encodeURIComponent(str).
    replace(/['()]/g, escape).
    replace(/\*/g, '%2A').
    replace(/%(?:7C|60|5E)/g, unescape);
}





function unZip(str) {
    const buffer = Buffer.from(str, 'base64');
    return zlib.unzipSync(buffer).toString();
}



function buildDataUseTimestamp(timestamp) {
    timestamp = Number(timestamp) || new Date();
    let date = new Date(timestamp * 1000);
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}


function getErr(res, code) {
    var error = apiConfig[env].errorCode ? apiConfig[env].errorCode : "undefined message";
    if (error.hasOwnProperty(code) === false) {
        res.message = "error code undefined!";
    } else {
        res.message = error[code];
    }
    res.status = code;
    return res;
}

function buildData(cpId, sign, timestamp, params) {
    params = params || {};
    if (typeof timestamp === 'object') {
        params = timestamp;
        timestamp = Math.floor(Date.now() / 1000);
    }
    var data = {
        cp_id: cpId,
        timestamp: timestamp,
        sign: sign
    };

    return Object.assign(data, params);
}


function createUserInfoInitData() {
    return {
        username: '',
        employee_id: 0,
        last_login: Date(),
        department: '',
        create_date: Date(),
        permission: []
    }
}

function createConditionObject(select, where, skip, limit, sort) {
    return {
        select: select || [],
        where: where || {},
        skip: skip || 0,
        limit: limit || 0,
        sort: sort || 'updatedAt DESC'
    };
}


// delete object key
function deleteObjectKey(obj, keys) {
    keys = keys || "";
    if (keys.length !== 0) {
        for (var i in keys) {
            delete obj[keys[i]];
        }
    }
    return obj;
}

// get timestamp
function getTimeStamp() {
    return Math.floor(Date.now() / 1000);
}

function mobile2Country(mobile, country) {
    let patten = /^[1-9]{8,20}$/;
    if (patten.test(mobile)) {
        if (country == 0) {
            throw new Error("country is invalid");
        }
        mobile = country + mobile;
    }

    // handle pass country is string
    mobile = mobile.replace(":country", "");

    return mobile;
}


function getInitRes() {
    return {
        data: {},
        message: '',
        status: 0
    };
}

function findKey(object, value) {
    for (var i in object) {
        if (object[i] == value)
            return i;
    }
    return 0;
}


/**
 * create request signature
 */
function createSign(params) {

    let md5 = crypto.createHash('md5');
    md5.update(params.toString());
    let md5Str = md5.digest('hex');
    return md5Str;
}

function getTimeStamp() {
    return Math.floor(Date.now() / 1000);
}

function getNodeResourceUri(nodeId, hashName) {
    return "http://" + path.join(sagittaConfig[env].domain, "/attachment/", nodeId || "", hashName || "");
}

function createUuid()
{
    let uuid = require("uuid");
    return uuid.v4();
}


function isEmpty(obj) {

    if (obj === null || obj === "" || obj === 0 || obj === "0") {
        return true;
    }
    if (Array.isArray(obj) && obj.length === 0) {
        return true;
    }
    for(var name in obj) {
        if(obj.hasOwnProperty(name))
        {
            return false;
        }
    }
    return true;
}


function escapeSpecialChar(str) {
    let specialArr = ["*", ".", "?", "+", "$", "^", "[", "]", "(", ")", "{", "}", "|", "/"];
    for(let i = 0; i < specialArr.length; i++) {
        let reg = new RegExp("\\"+specialArr[i],"g");
        str = str.replace(reg, "\\"+specialArr[i]);
    }
    return str;
}


module.exports = {
    createUserInfoInitData: createUserInfoInitData,
    createConditionObject: createConditionObject,
    deleteObjectKey: deleteObjectKey,
    mobile2Country: mobile2Country,
    buildDataUseTimestamp: buildDataUseTimestamp,
    getErr: getErr,
    buildData: buildData,
    joiValidate: Promise.promisify(Joi.validate),
    getInitRes: getInitRes,
    findKey: findKey,
    createSign: createSign,
    getTimeStamp: getTimeStamp,
    getNodeResourceUri: getNodeResourceUri,
    unZip: unZip,
    checkJWT: checkJWT,
    readJson: readJson,
    writeJson: writeJson,
    getImageBase64: getImageBase64,
    sendMail: sendMail,
    encodeRFC5987ValueChars: encodeRFC5987ValueChars,
    mergeObject:mergeObject,
    createUuid: createUuid,
    isEmpty:isEmpty,
    escapeSpecialChar:escapeSpecialChar

};


