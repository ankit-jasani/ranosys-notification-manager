/**
 * Update Notification Action
 * @module actions/updateNotification
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
 * Main entry point for the Update Notification action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @param {Object} params.data - payload containing id and updates.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {
  
  const logger = Core.Logger('updateNotification', {
    level: params.LOG_LEVEL || 'info'
  });

  try {

    // 'info' is the default level if not set
    logger.info('Calling update notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Parse data
    const { data } = params;
    const { id, updates } = data;

    // Validate inputs
    const requiredParams = ['data.id'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }
    if (!id || typeof updates !== 'object') {
      logger.error('Missing or invalid "id" or "updates" object');
      return errorResponse(400, 'Missing or invalid "id" or "updates" object', logger);
    }

    // If date range is being updated, validate the new start and end times
    if (updates.start && updates.end) {
      const startTime = new Date(updates.start);
      const endTime = new Date(updates.end);
      if (isNaN(startTime) || isNaN(endTime)) {
        logger.error('Invalid date format for Start or End');
        return errorResponse(400, 'Invalid date format for Start or End', logger);
      }
      if (endTime < startTime) {
        logger.error('Invalid date format for Start or End');
        return errorResponse(400, 'Invalid date format for Start or End', logger);
      }
    }

    // Initialize Adobe App Builder state SDK
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
      logger.error('Failed to parse notifications:', e);
    }

    // Check for overlapping time windows for the same position (excluding self by ID)
    const isOverlapping = notifications && notifications.some(n => (
      n.id !== id &&
      n.position === updates.position &&
      new Date(updates.start) < new Date(n.end) &&
      new Date(n.start) < new Date(updates.end)
    ));

    if (isOverlapping) {
      return errorResponse(400, 'Time window overlaps an existing notification', logger);
    }

    let updated = null;

    // Update the matching notification by id
    notifications = notifications.map(n => {
      if (n.id === id) {
        updated = { ...n, ...updates }; // Merge old and new fields
        return updated;
      }
      return n;
    });

    if (!updated) {
      logger.error(`Notification with id "${id}" not found`);
      return errorResponse(400, `Notification with id "${id}" not found`, logger);
    }

    // Persist the updated notifications back to state storage
    await state.put('notifications', JSON.stringify(notifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successfully updated notification`)

    // Return the updated notification in the response
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
