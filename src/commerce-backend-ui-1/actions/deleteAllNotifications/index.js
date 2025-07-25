/**
 * Delete All Notifications Action
 * @module actions/deleteAllNotifications
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs
} = require('../utils');

/**
 * Main entry point for the Delete All Notifications action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {

  const logger = Core.Logger('deleteAllNotifications', {
    level: params.LOG_LEVEL || 'info'
  });

  try {

    // 'info' is the default level if not set
    logger.info('Calling delete all notifications action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // validate headers if needed
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();

    // Overwrite the 'notifications' key with an empty list (clear all notifications)
    await state.put('notifications', JSON.stringify([]), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successfully cleared all notifications`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ success: true })
    };
    
  } catch (error) {
    logger.error(error);
    return errorResponse(500, 'server error', logger);
  }
};
