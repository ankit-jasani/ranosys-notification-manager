/**
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

const { DateTime } = require('luxon');

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters (params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and '
    } else {
      errorMessage = ''
    }
    errorMessage += `missing parameter(s) '${missingParams}'`
  }

  return errorMessage
}

/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}

/**
 * Parses a local date-time string (e.g. "15/07/2025, 08:30:00 PM")
 *
 * @param {string} str - The local date-time string.
 * @returns {Date} - A JavaScript Date object.
 */
function parseLocal(str) {
  const [datePart, timePartRaw] = str.split(',').map(s => s.trim());
  const [day, month, year] = datePart.split('/').map(Number);

  let [time, modifier] = timePartRaw.split(' ');
  let [hours, minutes, seconds = 0] = time.split(':').map(Number);

  if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
  if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}

/**
 * Returns current time as Luxon DateTime in the provided timezone or falls back to local parsing.
 * @param {string} tz - Optional timezone (e.g., 'Asia/Kolkata', 'America/New_York')
 * @returns {DateTime} Luxon DateTime object
 */
function getNow(tz) {
  if (tz) {
    const isoString = DateTime.now().setZone(tz).toString();
    const formatted = DateTime.fromISO(isoString, { zone: tz }).toFormat("dd/MM/yyyy, h:mm:ss a");
    return parseLocal(formatted);
  } else {
    const nowLocalString = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return parseLocal(nowLocalString);
  }
}

/**
 * Convert UTC to Specific Timezone.
 * @param {string} str - Required UTC datetime string (e.g., '2025-07-15T05:30:00.000Z')
 * @param {string} tz - Required timezone (e.g., 'Asia/Kolkata', 'America/New_York')
 * @returns {DateTime} Luxon DateTime object
 */
function getConvertedDateTime(str, tz) {
  const nowLocalString = DateTime.fromISO(str, { zone: 'utc' }).setZone(tz).toFormat("dd/MM/yyyy, h:mm:ss a");
  return parseLocal(nowLocalString);
}

/**
 * Helper to determine if a notification is active and matches position.
 * @param {object} n - Notification data
 * @param {string} now - Current time
 * @param {boolean} tzaware - Convert available notifications timezone with provided timezone
 * @param {string} tz - Timezone (e.g., 'Asia/Kolkata', 'America/New_York')
 * @param {string} position - Filter notification based on type (e.g., 'Header')
 * @param {boolean} isActiveNotificationsOnly - Show only active notifications - either currently active or those without an end time in the past. 
 * @returns adjusted notification if valid, otherwise null.
 */
function getUpdatedNotifications(n, now, tzaware, tz, position, isActiveNotificationsOnly) {
  const adjustedStart = tzaware === 'true' && tz ? getConvertedDateTime(n.start, tz) : new Date(n.start);
  const adjustedEnd = tzaware === 'true' && tz ? getConvertedDateTime(n.end, tz) : new Date(n.end);

  const isActive = isActiveNotificationsOnly ? now >= adjustedStart && now <= adjustedEnd : now <= adjustedEnd;
  const matchesPosition = !position || n.position === position;

  if (isActive && matchesPosition) {
    return [{
      ...n,
      adjustedStart,
      adjustedEnd
    }];
  }

  return [];
}

module.exports = {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  parseLocal,
  getNow,
  getConvertedDateTime,
  getUpdatedNotifications
}
