/**
 * Get Active Notifications Action
 * @module actions/notifications/active
 * Copyright 2025 Ranosys Technologies. All rights reserved.
 */

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  getNow,
  getUpdatedNotifications
} = require('../../utils');

/**
 * Main entry point for the get Active Notifications action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @param {Object} params.data - payload containing position, tz, tzaware.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {

  const logger = Core.Logger('activeNotifications', {
    level: params.LOG_LEVEL || 'info'
  });

  try {
    
    // 'info' is the default level if not set
    logger.info('Calling active notifications action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Validate headers
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, [], requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const { position, tz, tzaware } = params;

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
        body: JSON.stringify({ data: [] })
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
      const updatedItems = getUpdatedNotifications(n, now, tzaware, tz, position, true);
      for (const item of updatedItems) {
        const { id, ...rest } = item;
        result.push(rest);
      }
    }

    // log the response status code
    logger.info(`Successfully retrieved active notifications`);

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