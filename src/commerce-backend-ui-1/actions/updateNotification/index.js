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
    logger.info('Calling the update notification action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    const { data } = params;
    const { id, updates } = data;

    // check for missing request input parameters and headers
    const requiredParams = ['data.id','data.updates.start','data.updates.end','data.updates.content','data.updates.position'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    // Validate required inputs: 'id' and 'updates' object must be present
    if (!id || typeof updates !== 'object') {
      logger.error('Missing or invalid "id" or "updates" object');
      return {
        statusCode: 400,
        body: 'Missing or invalid "id" or "updates" object'
      };
    }

    // If date range is being updated, validate the new start and end times
    if (updates.start && updates.end) {
      const startTime = new Date(updates.start);
      const endTime = new Date(updates.end);
      if (isNaN(startTime) || isNaN(endTime)) {
        logger.error('Invalid date format for "start" or "end"');
        return {
          statusCode: 400,
          body: 'Invalid date format for "start" or "end"'
        };
      }
      if (endTime < startTime) {
        logger.error('"end" time must be the same or after "start" time');
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: '"end" time must be the same or after "start" time'
          })
        };
      }
    }

    // Initialize Adobe App Builder state SDK
    const state = await stateLib.init();

    // Retrieve notifications from state storage
    const stored = await state.get('notifications');
    if (!stored?.value) {
      logger.error('No data found');
      return {
        statusCode: 400,
        body: 'No data found'
      };
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
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Time window overlaps an existing notification for same position or id not exist.'
        })
      };
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
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Notification with id "${id}" not found` })
      };
    }

    // Persist the updated notifications back to state storage
    await state.put('notifications', JSON.stringify(notifications), { ttl: stateLib.MAX_TTL });

    // log the response status code
    logger.info(`Successful request`)

    // Return the updated notification in the response
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
