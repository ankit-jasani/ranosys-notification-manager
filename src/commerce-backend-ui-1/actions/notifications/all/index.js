/**
 * Get All Notifications Action
 * @module actions/notifications/all
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs
} = require('../../utils');

/**
 * Main entry point for the get All Notifications action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @param {Object} params.data - payload containing position.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {

  const logger = Core.Logger('allNotifications', {
    level: params.LOG_LEVEL || 'info'
  });

  try {

    // 'info' is the default level if not set
    logger.info('Calling all notifications action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Validate headers
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const { position } = params;

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();

    // Retrieve notifications from state storage
    const stored = await state.get('notifications');
    if (!stored?.value) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ data: [] })
      };
    }

    let notifications = [];
    try {
      notifications = JSON.parse(stored.value);
    } catch (e) {
      logger.error('Failed to parse notifications:', e);
    }

    // Filter notifications (by position if provided) and omit `id`
    const result = notifications
      .filter(n => !position || n.position === position)
      .map(({ id, ...rest }) => rest); // Exclude 'id' field if not needed in response

    // log the response status code
    logger.info(`Successfully retrieved all notifications`);

    // Return filtered notifications as a JSON response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ data: result })
    };

  } catch (error) {
    logger.error(error);
    return errorResponse(500, 'server error', logger);
  }
};
