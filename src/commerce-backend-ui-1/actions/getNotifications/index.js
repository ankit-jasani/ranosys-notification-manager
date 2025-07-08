/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async (params = {}) => {
  const state = await stateLib.init();
  const stored = await state.get('notifications');
  const notifications = stored?.value ? JSON.parse(stored.value) : [];

  // optionally filter active
  const { activeOnly } = params;
  let result = notifications;
  if (activeOnly) {
    const now = Date.now();
    result = notifications.filter(n => {
      const start = new Date(n.start).getTime();
      const end = new Date(n.end).getTime();
      return start <= now && now <= end;
    });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notifications: result })
  };
};
