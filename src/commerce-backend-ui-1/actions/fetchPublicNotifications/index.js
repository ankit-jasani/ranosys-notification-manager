/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

const { DateTime } = require('luxon');
const fetch = require('node-fetch');
/**
 * Fetches public notifications filtered by timezone and type.
 * @param {{type?: string, timezone: string}} params
 */
exports.main = async (params) => {
  const { type, timezone } = params;
  if (!timezone) {
    return { statusCode: 400, body: { error: 'timezone parameter is required' } };
  }
  const nowUtc = DateTime.now().setZone(timezone).toUTC();
  const resp = await fetch(process.env.NOTIFICATION_API_URL);
  if (!resp.ok) {
    return { statusCode: resp.status, body: { error: 'Failed to fetch notifications' } };
  }
  const all = await resp.json();
  const visible = all.filter(note => {
    if (type && note.type !== type) return false;
    const startUtc = DateTime.fromISO(note.start, { zone: 'utc' });
    const endUtc = DateTime.fromISO(note.end, { zone: 'utc' });
    return nowUtc >= startUtc && nowUtc < endUtc;
  });
  return { statusCode: 200, body: { notifications: visible } };
};