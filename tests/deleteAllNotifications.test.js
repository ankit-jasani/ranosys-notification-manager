/**
 * deleteAllNotifications/index.js → tests/deleteAllNotifications.test.js
 */

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockResolvedValue({
    put: jest.fn().mockResolvedValue(true),
    MAX_TTL: 3600
  })
}));

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn()
    }))
  }
}));

const { main } = require('../src/commerce-backend-ui-1/actions/deleteAllNotifications/index');
const stateLib = require('@adobe/aio-lib-state');

describe('deleteAllNotifications action', () => {
  const validParams = {
    __ow_headers: { authorization: 'Bearer token' }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('successfully clears all notifications', async () => {
    const response = await main(validParams);
    // Success path returns flat fields
    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(response.body || '{}');
    expect(body.success).toBe(true);

    // Ensure the SDK was invoked correctly
    expect(stateLib.init).toHaveBeenCalled();
    const state = await stateLib.init();
    expect(state.put).toHaveBeenCalledWith(
      'notifications',
      JSON.stringify([]),
      { ttl: stateLib.MAX_TTL }
    );
  });

  test('fails when Authorization header is missing', async () => {
    const response = await main(); // no headers
    // Error path nests under `error`
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/missing header.*authorization/i);
  });

  test('handles state SDK init/put errors gracefully', async () => {
    // Simulate init throwing
    stateLib.init.mockRejectedValueOnce(new Error('init failed'));

    const response = await main(validParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/i);
  });
});
