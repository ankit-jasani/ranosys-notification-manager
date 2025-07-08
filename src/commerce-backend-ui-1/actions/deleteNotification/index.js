/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async (params = {}) => {
  const { id } = params;
  if (!id) {
    return { statusCode: 400, body: 'Missing id' };
  }
  const state = await stateLib.init();
  const stored = await state.get('notifications');
  const list = stored?.value ? JSON.parse(stored.value) : [];

  const newList = list.filter(n => n.id !== id);
  await state.put('notifications', JSON.stringify(newList));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  };
};