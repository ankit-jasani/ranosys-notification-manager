/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async (params = {}) => {
  // Initialize Adobe State Library client for persistent key-value access
  const state = await stateLib.init();

  // Retrieve the stored notifications (as JSON string), or return empty array
  const stored = await state.get('notifications');
  const notifications = stored?.value ? JSON.parse(stored.value) : [];

  // Return the list of notifications in JSON response
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notifications })
  };
};
