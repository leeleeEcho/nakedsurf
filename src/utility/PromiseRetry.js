"use strict";

let retry = function(fn, context, args, retryLeft) {
  retryLeft = retryLeft || 3;
  return fn.apply(context, args).catch((err) => {
    // logger.warn('[PromiseRetry][%s] Fn "%s" failed with %s, retry left: %d', process.pid, fn.name, err.message, retryLeft);
    if (retryLeft <= 0) {
      // logger.error('[PromiseRetry][%s] Fn "%s" failed with %s, no retry left', process.pid, fn.name, err.message);
      throw err;
    }
    return retry(fn, context, args, retryLeft - 1);
  });
};

module.exports = retry;