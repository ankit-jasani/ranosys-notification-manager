/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');
const { v4: uuid } = require('uuid');

exports.main = async params => {
  const { notification } = params;
  
  if (!notification) {
    return { statusCode: 400, body: 'Missing notification payload' };
  }

  const startTime = new Date(notification.start);
  const endTime   = new Date(notification.end);

  if (endTime < startTime) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid date range: "end" must be the same or after "start".' })
    };
  }

  const state = await stateLib.init();
  const stored = await state.get('notifications');
  const list = stored?.value ? JSON.parse(stored.value) : [];

  const overlap = list.some(n => {
    if (n.id === notification.id) return false;
    if (n.location !== notification.location) return false;

    const existingStart = new Date(n.start);
    const existingEnd   = new Date(n.end);

    return startTime < existingEnd && existingStart < endTime;
  });

  if (overlap) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Time window overlaps an existing notification.'
      })
    };
  }

  const newNotification = { ...notification };
  
  list.push(newNotification);

  await state.put('notifications', JSON.stringify(list));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification: newNotification })
  };
};
