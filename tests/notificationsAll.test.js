/**
 * notifications/all/index.js → tests/notificationsAll.test.js
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

const { main } = require('../src/commerce-backend-ui-1/actions/notifications/all/index');
const stateLib = require('@adobe/aio-lib-state');

describe('allNotifications action', () => {
  const validParams = {
    __ow_headers: { authorization: 'Bearer token' },
    position: 'Header'
  };

  afterEach(() => jest.clearAllMocks());

  test('fails when Authorization header is missing', async () => {
    const response = await main({}); // no headers
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/missing header.*authorization/i);
  });

  test('returns empty list when no stored.value', async () => {
    const mockState = { get: jest.fn().mockResolvedValue({}) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toEqual([]);
  });

  test('handles JSON parse error by returning empty data', async () => {
    const mockState = { get: jest.fn().mockResolvedValue({ value: 'bad-json' }) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual([]);
  });

  test('returns all notifications without filtering when position not provided', async () => {
    const notifications = [
      { id: '1', content: 'A', position: 'Header' },
      { id: '2', content: 'B', position: 'Footer' }
    ];
    const mockState = { get: jest.fn().mockResolvedValue({ value: JSON.stringify(notifications) }) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const paramsNoPos = { __ow_headers: { authorization: 'Bearer token' } };
    const response = await main(paramsNoPos);
    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body).data;
    // Should include both, with id stripped out
    expect(data).toEqual([
      { content: 'A', position: 'Header' },
      { content: 'B', position: 'Footer' }
    ]);
  });

  test('filters notifications by position and strips id', async () => {
    const notifications = [
      { id: '1', content: 'A', position: 'Header' },
      { id: '2', content: 'B', position: 'Footer' }
    ];
    const mockState = { get: jest.fn().mockResolvedValue({ value: JSON.stringify(notifications) }) };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);
    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body).data;
    // Only the Header notification remains, id removed
    expect(data).toEqual([{ content: 'A', position: 'Header' }]);
  });

  test('handles state SDK init error gracefully', async () => {
    stateLib.init.mockRejectedValueOnce(new Error('init failure'));
    const response = await main(validParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/i);
  });
});
