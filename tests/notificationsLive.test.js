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

jest.mock('../src/commerce-backend-ui-1/actions/utils', () => ({
  errorResponse: jest.fn((statusCode, message) => ({
    error: {
      statusCode,
      body: { error: message }
    }
  })),
  stringParameters: jest.fn(),
  checkMissingRequestInputs: jest.fn((params, required, headers) => {
    const hasAuth = !!params.__ow_headers?.authorization;
    return hasAuth ? null : 'missing header(s) authorization';
  }),
  getNow: jest.fn(),
  getUpdatedNotifications: jest.fn()
}));

const { main } = require('../src/commerce-backend-ui-1/actions/notifications/live/index');
const stateLib = require('@adobe/aio-lib-state');
const utils = require('../src/commerce-backend-ui-1/actions/utils');

describe('liveNotifications action', () => {
  const baseParams = {
    __ow_headers: { authorization: 'Bearer token' },
    position: 'Footer',
    tz: 'Asia/Kolkata',
    tzaware: true
  };

  afterEach(() => jest.clearAllMocks());

  test('fails when Authorization header is missing', async () => {
    const response = await main({});
    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/authorization/i);
  });

  test('fails on invalid timezone format', async () => {
    const response = await main({
      __ow_headers: { authorization: 'Bearer token' },
      tzaware: true,
      tz: 123 // invalid format
    });

    expect(response.error.statusCode).toBe(400);
    expect(response.error.body.error).toMatch(/Invalid timezone format/i);
  });

  test('returns empty list if no stored notifications', async () => {
    stateLib.init.mockResolvedValueOnce({ get: jest.fn().mockResolvedValue({}) });

    const response = await main(baseParams);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual([]);
  });

  test('handles JSON parse error by returning empty data', async () => {
    stateLib.init.mockResolvedValueOnce({
      get: jest.fn().mockResolvedValue({ value: 'INVALID_JSON' })
    });

    const response = await main(baseParams);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual([]);
  });

  test('handles state SDK init failure', async () => {
    stateLib.init.mockRejectedValueOnce(new Error('Init error'));

    const response = await main(baseParams);
    expect(response.error.statusCode).toBe(500);
    expect(response.error.body.error).toMatch(/server error/i);
  });

  test('returns transformed notifications via getUpdatedNotifications', async () => {
    const mockNotifications = [
      { id: '1', title: 'Notif1', position: 'Footer' },
      { id: '2', title: 'Notif2', position: 'Footer' }
    ];

    // Mock state storage
    stateLib.init.mockResolvedValueOnce({
      get: jest.fn().mockResolvedValue({
        value: JSON.stringify(mockNotifications)
      })
    });

    const mockNow = new Date();
    utils.getNow.mockReturnValue(mockNow);

    // Mock getUpdatedNotifications to return list with 'id'
    utils.getUpdatedNotifications.mockImplementation((n, now, tzaware, tz, pos, isActive) => {
      return [{ id: n.id, live: true }];
    });

    const response = await main(baseParams);
    const data = JSON.parse(response.body).data;

    expect(utils.getNow).toHaveBeenCalledWith('Asia/Kolkata');
    expect(utils.getUpdatedNotifications).toHaveBeenCalledTimes(mockNotifications.length);
    expect(data).toEqual([
      { live: true },
      { live: true }
    ]);
    expect(response.statusCode).toBe(200);
  });
});
