/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async params => {
  const { id, updates } = params;
  if (!id || typeof updates !== 'object') {
    return { statusCode: 400, body: 'Missing id or updates' };
  }
  if (new Date(updates.end) < new Date(updates.start)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid date range: "end" must be the same or after "start".' })
    };
  }
  const state = await stateLib.init();
  const stored = await state.get('notifications');
  let list = stored?.value ? JSON.parse(stored.value) : [];

  let updated = null;
  list = list.map(n => {
    if (n.id === id) {
      updated = { ...n, ...updates };
      return updated;
    }
    return n;
  });

  await state.put('notifications', JSON.stringify(list));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification: updated })
  };
};
