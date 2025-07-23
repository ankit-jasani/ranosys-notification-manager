/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils');

exports.main = async (params) => {
  
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {

    // 'info' is the default level if not set
    logger.info('Calling the update notification action');

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

    const { id, updates } = params;

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
        logger.error('"end" time must be the same or after "start" time.');
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: '"end" time must be the same or after "start" time.'
          })
        };
      }
    }

    // Initialize Adobe State Library for persistent storage
    const state = await stateLib.init();

    // Retrieve existing notification list from storage
    const stored = await state.get('notifications');
    let list = stored?.value ? JSON.parse(stored.value) : [];

    let updated = null;

    // Update the matching notification by id
    list = list.map(n => {
      if (n.id === id) {
        updated = { ...n, ...updates }; // Merge old and new fields
        return updated;
      }
      return n;
    });

    // Persist the updated list back to state storage
    await state.put('notifications', JSON.stringify(list));

    // log the response status code
    logger.info(`Successful request`)

    // Return the updated notification in the response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification: updated })
    };

  } catch (error) {
    // log any server errors
    logger.error(error);
    // return with 500
    return errorResponse(500, 'server error', logger);
  }

};
