/**
 * Delete Notification Action
 * @module actions/deleteNotification
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
 * Main entry point for the Delete Notification action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @param {Object} params.data - payload containing id.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {

  const logger = Core.Logger('deleteNotification', {
    level: params.LOG_LEVEL || 'info'
  });

  try {

    // 'info' is the default level if not set
    logger.info('Calling delete notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // check for missing request input parameters and headers
    const requiredParams = ['data.id'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    // Parse data
    const { data } = params;
    const { id } = data || {};

    // Initialize Adobe State Library client for key-value store access
    const state = await stateLib.init();

    // Retrieve notifications from state storage
    const stored = await state.get('notifications');
    if (!stored?.value) {
      logger.error('No notifications found');
      return errorResponse(400, 'No notifications found', logger);
    }

    let notifications = [];
    try {
      notifications = JSON.parse(stored.value);
    } catch (e) {
      logger.warn('Failed to parse notifications:', e);
    }

    const exists = notifications.some(n => n.id === id);
    if (!exists) {
      logger.error(`Notification with id "${id}" not found`);
      return errorResponse(400, `Notification with id "${id}" not found`, logger);
    }
    
    // Filter out the notification with the matching 'id'
    const filteredNotifications = notifications.filter(n => n.id !== id);

    // Save updated notification list
    await state.put('notifications', JSON.stringify(filteredNotifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successfully deleted notification`);

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
