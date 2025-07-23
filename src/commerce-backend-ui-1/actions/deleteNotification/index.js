/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async (params = {}) => {
  // Destructure 'id' from request parameters
  const { id } = params;

  // Validate: 'id' must be provided
  if (!id) {
    return {
      statusCode: 400,
      body: 'Missing id'
    };
  }

  // Initialize Adobe State Library client for key-value store access
  const state = await stateLib.init();

  // Retrieve stored notifications (as JSON string), fallback to empty array
  const stored = await state.get('notifications');
  const list = stored?.value ? JSON.parse(stored.value) : [];

  // Filter out the notification with the matching 'id'
  const newList = list.filter(n => n.id !== id);

  // Save updated notification list
  await state.put('notifications', JSON.stringify(newList));

  // Return success response with deleted id
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }) // Echo deleted ID
  };
};
