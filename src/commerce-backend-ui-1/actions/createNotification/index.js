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
    logger.info('Calling the create notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // Validate required notification payload
    if (!params.data) {
      logger.error('Missing payload');
      return {
        statusCode: 400,
        body: 'Missing payload'
      };
    }

    const { data } = params;
    const { id, start, end, content, position } = data;

    // check for missing request input parameters and headers
    const requiredParams = ['data.start','data.end','data.id','data.content','data.position'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();    

    // Parse start and end timestamps
    const startTime = new Date(start);
    const endTime = new Date(end);

    // Validate date format
    if (isNaN(startTime) || isNaN(endTime)) {
      return { statusCode: 400, body: 'Invalid date format.' };
    }

    // Validate chronological order: end must not be before start
    if (endTime < startTime) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: '"end" time must be the same or after "start" time.'
        })
      };
    }

    // Retrieve notifications from state storage
    let notifications = [];
    const stored = await state.get('notifications');
    
    try {
      notifications = !stored?.value ? [] : JSON.parse(stored.value);
    } catch (e) {
      logger.error('Failed to parse notifications:', e);
    }

    const exists = notifications.some(n => n.id === id);
    if (exists) {
      logger.error(`Notification with same id "${id}" already exists`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Notification with same id "${id}" already exists` })
      };
    }

    // Check for overlapping time windows for the same position (excluding self by ID)
    const isOverlapping = notifications && notifications.some(n => (
      /* n.id !== id && */
      n.position === position &&
      new Date(start) < new Date(n.end) &&
      new Date(n.start) < new Date(end)
    ));

    if (isOverlapping) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Time window overlaps an existing notification.'
        })
      };
    }

    // Add the new notification to the list
    notifications.push(data);

    // Persist the updated list back to the store
    await state.put('notifications', JSON.stringify(notifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successful request`);

    // Return success response with the stored notification
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
