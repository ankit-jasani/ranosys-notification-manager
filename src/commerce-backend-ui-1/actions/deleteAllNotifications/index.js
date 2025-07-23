/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async () => {
  // Initialize Adobe State Library client for state management
  const state = await stateLib.init();

  // Overwrite the 'notifications' key with an empty list (clear all notifications)
  await state.put('notifications', JSON.stringify([]));

  // Return success response
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  };
};
