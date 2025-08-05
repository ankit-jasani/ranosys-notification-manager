/**
 * notifications/active/index.js → tests/notificationsActive.test.js
 */

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn()
}));

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }))
  }
}));

const { main } = require('../src/commerce-backend-ui-1/actions/notifications/active/index');
const stateLib = require('@adobe/aio-lib-state');

describe('activeNotifications action', () => {
  const baseParams = {
    __ow_headers: { authorization: 'Bearer token' },
    position: 'Header',
    tz: 'Asia/Kolkata',
    tzaware: true
  };

  afterEach(() => jest.clearAllMocks());

  test('fails when Authorization header is missing', async () => {
    const response = await main({});
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/missing header.*authorization/i);
  });

  test('fails on invalid timezone format', async () => {
    const response = await main({
      __ow_headers: { authorization: 'Bearer token' },
      tz: 123,
      tzaware: true
    });
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/Invalid timezone format/i);
  });

  test('returns empty list if no stored.value', async () => {
    stateLib.init.mockResolvedValueOnce({ get: jest.fn().mockResolvedValue({}) });
    const response = await main(baseParams);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual([]);
  });

  test('handles JSON parse error by returning empty data', async () => {
    stateLib.init.mockResolvedValueOnce({ get: jest.fn().mockResolvedValue({ value: 'bad-json' }) });
    const response = await main(baseParams);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual([]);
  });

  test('handles state SDK init error gracefully', async () => {
    stateLib.init.mockRejectedValueOnce(new Error('init fail'));
    const response = await main(baseParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/i);
  });
});
