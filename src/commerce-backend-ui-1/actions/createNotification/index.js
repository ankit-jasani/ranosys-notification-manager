/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async ({ notification }) => {
  // Validate required notification payload
  if (!notification) {
    return { statusCode: 400, body: 'Missing notification payload' };
  }

  // Parse start and end timestamps
  const startTime = new Date(notification.start);
  const endTime = new Date(notification.end);

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

  // Initialize Adobe State Library to read/write persistent data
  const state = await stateLib.init();

  // Retrieve existing notifications (stored as JSON string)
  const stored = await state.get('notifications');
  const list = stored?.value ? JSON.parse(stored.value) : [];

  // Check for overlapping time windows for the same location (excluding self by ID)
  const isOverlapping = list.some(n => (
    n.id !== notification.id &&
    n.location === notification.location &&
    new Date(notification.start) < new Date(n.end) &&
    new Date(n.start) < new Date(notification.end)
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
  list.push(notification);

  // Persist the updated list back to the store
  await state.put('notifications', JSON.stringify(list));

  // Return success response with the stored notification
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification })
  };
};
