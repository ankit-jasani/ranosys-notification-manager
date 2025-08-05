/**
 * Create Notification Action
 * @module actions/createNotification
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
 * Main entry point for the Create Notification action.
 * @param {Object} params - The parameters passed by Adobe App Builder.
 * @param {Object} params.data - payload containing id, start, end, content, and position.
 * @returns {Promise<Object>} HTTP response object.
 */
exports.main = async (params = {}) => {

  const logger = Core.Logger('createNotification', {
    level: params.LOG_LEVEL || 'info'
  });

  try {

    // 'info' is the default level if not set
    logger.info('Calling create notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Validate required inputs and headers
    const requiredParams = [
      'data.id',
      'data.start',
      'data.end',
      'data.content',
      'data.position'
    ];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(
      params,
      requiredParams,
      requiredHeaders
    );
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    // Parse data
    const { id, start, end, content, position } = params.data;    

    // Parse start and end timestamps
    const startTime = new Date(start);
    const endTime = new Date(end);

    // Validate date format
    if (isNaN(startTime) || isNaN(endTime)) {
      return errorResponse(400, 'Invalid date format', logger);
    }

    // Validate chronological order: end must not be before start
    if (endTime < startTime) {
      return errorResponse(400, 'End time must be the same or after Start time', logger);
    }

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();

    // Load all existing notifications
    let notifications = [];
    const stored = await state.get('notifications');
    
    try {
      notifications = !stored?.value ? [] : JSON.parse(stored.value);
    } catch (e) {
      logger.warn('Failed to parse notifications:', e);
    }

    // Check duplicate ID
    const exists = notifications.some(n => n.id === id);
    if (exists) {
      logger.error(`Notification with id "${id}" already exists`);
      return errorResponse(
        400,
        `Notification with id "${id}" already exists`,
        logger
      );
    }

    // Check for overlapping time windows for the same position (excluding self by ID)
    const isOverlapping = notifications && notifications.some(n => (
      /* n.id !== id && */
      n.position === position &&
      new Date(start) < new Date(n.end) &&
      new Date(n.start) < new Date(end)
    ));

    if (isOverlapping) {
      return errorResponse(
        400,
        `Time window overlaps an existing notification`,
        logger
      );
    }

    // Add the new notification to the list
    notifications.push(params.data);

    // Persist the updated list back to the store
    await state.put('notifications', JSON.stringify(notifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Notification created successfully`);

    // Return success response with the stored notification
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
