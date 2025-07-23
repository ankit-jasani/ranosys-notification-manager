/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, stringParameters, checkMissingRequestInputs, getNow, getUpdatedNotifications } = require('../../utils');

exports.main = async (params = {}) => {

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    
    // 'info' is the default level if not set
    logger.info('Calling the active notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // check for missing request input parameters and headers
    const requiredParams = [/* add required params */];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    const { location, tz, tzaware } = params;

    // Defensive validation
    if (tzaware && tz && typeof tz !== 'string') {
      return errorResponse(400, 'Invalid timezone format', logger);
    }

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();

    // Retrieve notifications from state storage
    const stored = await state.get('notifications');
    if (!stored?.value) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ notifications: [] })
      };
    }

    let notifications = [];
    try {
      notifications = JSON.parse(stored.value);
    } catch (e) {
      logger.error('Failed to parse notifications:', e);
    }

    const now = getNow(tz);
    const result = [];

    for (const n of notifications) {
      const updatedItems = getUpdatedNotifications(n, now, tzaware, tz, location, true);
      for (const item of updatedItems) {
        const { id, ...rest } = item;
        result.push(rest);
      }
    }

    // log the response status code
    logger.info(`Successful request`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ notifications: result })
    };

  } catch (error) {
    // log any server errors
    logger.error(error);

    // return with 500
    return errorResponse(500, 'server error', logger);
  }
};