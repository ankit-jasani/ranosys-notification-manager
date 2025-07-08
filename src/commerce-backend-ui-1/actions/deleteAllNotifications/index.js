/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const stateLib = require('@adobe/aio-lib-state');

exports.main = async () => {
  const state = await stateLib.init();
  await state.put('notifications', JSON.stringify([]));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  };
};