/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils');

exports.main = async (params = {}) => {

  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {

    // 'info' is the default level if not set
    logger.info('Calling the all notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    const { data } = params;
    const { id } = data;

    // check for missing request input parameters and headers
    const requiredParams = ['data.id'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    // Validate: 'id' must be provided
    if (!id) {
      return {
        statusCode: 400,
        body: 'Missing id'
      };
    }

    // Initialize Adobe State Library client for key-value store access
    const state = await stateLib.init();

    // Retrieve notifications from state storage
    const stored = await state.get('notifications');
    if (!stored?.value) {
      logger.error(`No data available`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: `No data available` })
      };
    }

    let notifications = [];
    try {
      notifications = JSON.parse(stored.value);
    } catch (e) {
      logger.error('Failed to parse notifications:', e);
    }

    const exists = notifications.some(n => n.id === id);
    if (!exists) {
      logger.error(`Notification with id "${id}" not found`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Notification with id "${id}" not found` })
      };
    }
    // Filter out the notification with the matching 'id'
    const filteredNotifications = notifications.filter(n => n.id !== id);

    // Save updated notification list
    await state.put('notifications', JSON.stringify(filteredNotifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successful request`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    // log any server errors
    logger.error(error);

    // return with 500
    return errorResponse(500, 'server error', logger);
  }
};
