const localIp = require('ip').address();
const port = process.env.PORT || 8039;
 // const port = 3612;
module.exports = {
  // ======================================================
  // Overrides when NODE_ENV === 'development'
  // ======================================================
  development: {
    domain: localIp + ':' + port,
    host: localIp,
    port: port,
    protocol: 'http',
    apiVer: '1.0'
  },

  // ======================================================
  // Overrides when NODE_ENV === 'production'
  // ======================================================
  // production: {
  //   domain: localIp + ':' + port,
  //   host: localIp,
  //   port: port,
  //   protocol: 'http',
  //   apiVer: '1.0'
  // },
  production: {
    domain: 'om.shinezone.net.cn',
    host: '0.0.0.0',
    port: '80',
    protocol: 'http',
    apiVer: '1.0'
  },

  // ======================================================
  // Overrides when NODE_ENV === 'preview'
  // ======================================================
  preview: {
    domain: 'om.shinezone.net.cn',
    host: '0.0.0.0',
    port: '8081',
    protocol: 'http',
    apiVer: '1.0'
  }
};
