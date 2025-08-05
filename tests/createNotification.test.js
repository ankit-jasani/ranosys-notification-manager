/**
 * createNotification/index.js → tests/createNotification.test.js
 */

jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockResolvedValue({
    get: jest.fn().mockResolvedValue({ value: '[]' }),
    put: jest.fn().mockResolvedValue(true),
    MAX_TTL: 3600
  })
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

const { main } = require('../src/commerce-backend-ui-1/actions/createNotification/index');
const stateLib = require('@adobe/aio-lib-state');

describe('createNotification action', () => {
  const validParams = {
    __ow_headers: { authorization: 'Bearer token' },
    data: {
      id: 'notif1',
      start: '2025-08-05T10:00:00Z',
      end: '2025-08-05T12:00:00Z',
      content: 'Test notification',
      position: 'Header'
    }
  };

  afterEach(() => jest.clearAllMocks());

  test('successfully creates a new notification', async () => {
    const response = await main(validParams);
    // success returns flat statusCode/body
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  test('fails when a required field is missing', async () => {
    const params = { __ow_headers: {} }; // missing data
    const response = await main(params);
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/missing.*data\.id/);
  });

  test('fails on invalid date format', async () => {
    const params = JSON.parse(JSON.stringify(validParams));
    params.data.start = 'not-a-date';
    const response = await main(params);
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/Invalid date format/);
  });

  test('fails when end is before start', async () => {
    const params = JSON.parse(JSON.stringify(validParams));
    params.data.end = '2025-08-05T08:00:00Z';
    const response = await main(params);
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/End time must be the same or after Start time/);
  });

  test('fails when notification ID already exists', async () => {
    // Arrange state.get to return an existing notification
    stateLib.init.mockResolvedValueOnce({
      get: jest.fn().mockResolvedValue({ value: JSON.stringify([validParams.data]) }),
      put: jest.fn(),
      MAX_TTL: 3600
    });

    const response = await main(validParams);
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/already exists/);
  });

  test('fails when time window overlaps an existing notification', async () => {
    const overlapping = {
      id: 'other',
      start: '2025-08-05T11:00:00Z',
      end: '2025-08-05T13:00:00Z',
      position: 'Header'
    };
    stateLib.init.mockResolvedValueOnce({
      get: jest.fn().mockResolvedValue({ value: JSON.stringify([overlapping]) }),
      put: jest.fn(),
      MAX_TTL: 3600
    });

    const response = await main(validParams);
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/overlaps/);
  });

  test('handles state get/put errors gracefully', async () => {
    stateLib.init.mockRejectedValueOnce(new Error('state failure'));

    const response = await main(validParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/);
  });
});
