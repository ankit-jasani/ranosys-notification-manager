/**
 * getNotifications/index.js → tests/getNotifications.test.js
 */

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn()
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

const { main } = require('../src/commerce-backend-ui-1/actions/getNotifications/index');
const stateLib = require('@adobe/aio-lib-state');

describe('getNotifications action', () => {
  const validParams = { __ow_headers: { authorization: 'Bearer token' } };

  afterEach(() => jest.clearAllMocks());

  test('successfully returns empty list when no stored value', async () => {
    // state.get returns {} → no stored.value
    const mockState = { get: jest.fn().mockResolvedValue({}) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toEqual([]);
  });

  test('successfully returns parsed notifications', async () => {
    const notifications = [{ id: '1' }, { id: '2' }];
    const mockState = { get: jest.fn().mockResolvedValue({ value: JSON.stringify(notifications) }) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toEqual(notifications);
  });

  test('handles JSON parse error by returning empty data array', async () => {
    // stored.value is invalid JSON
    const mockState = { get: jest.fn().mockResolvedValue({ value: 'not-json' }) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // on parse error, notifications remains []
    expect(body.data).toEqual([]);
  });

  test('fails when Authorization header is missing', async () => {
    const response = await main({}); // no headers
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/missing header.*authorization/i);
  });

  test('handles state SDK init error gracefully', async () => {
    stateLib.init.mockRejectedValueOnce(new Error('init failed'));
    const response = await main(validParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/i);
  });
});
