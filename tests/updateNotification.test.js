const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');
const utils = require('../src/commerce-backend-ui-1/actions/utils');
const { main } = require('../src/commerce-backend-ui-1/actions/updateNotification');

jest.mock('@adobe/aio-lib-state');
jest.mock('@adobe/aio-sdk');
jest.mock('../src/commerce-backend-ui-1/actions/utils');

describe('updateNotification Action', () => {
  let mockLogger;
  let mockState;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn()
    };

    Core.Logger = jest.fn(() => mockLogger);

    mockState = {
      get: jest.fn(),
      put: jest.fn()
    };

    stateLib.init.mockResolvedValue(mockState);

    utils.stringParameters.mockImplementation(params => JSON.stringify(params));
    utils.checkMissingRequestInputs.mockReturnValue(null);
    utils.errorResponse.mockImplementation((code, msg, logger) => ({
      error: {
        statusCode: code,
        body: {
          error: msg
        }
      }
    }));
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 200 on successful update', async () => {
    const params = {
      LOG_LEVEL: 'debug',
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'notif-1',
        updates: {
          title: 'Updated Title',
          start: '2025-08-01T10:00:00Z',
          end: '2025-08-01T12:00:00Z'
        }
      }
    };

    const existing = [
      {
        id: 'notif-1',
        title: 'Old Title',
        start: '2025-08-01T08:00:00Z',
        end: '2025-08-01T10:00:00Z',
        position: 'Header'
      }
    ];

    mockState.get.mockResolvedValue({ value: JSON.stringify(existing) });

    const result = await main(params);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ success: true });
    expect(mockState.put).toHaveBeenCalledWith(
      'notifications',
      expect.any(String),
      { ttl: stateLib.MAX_TTL }
    );
  });

  test('returns 400 if required parameters are missing', async () => {
    utils.checkMissingRequestInputs.mockReturnValue("missing parameter(s) 'data.id'");

    const result = await main({ data: {} });

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/missing parameter/);
  });

  test('returns 400 if "data" is missing entirely', async () => {
    utils.checkMissingRequestInputs.mockReturnValue(null);

    const params = {
      __ow_headers: { authorization: 'Bearer token' }
      // no `data` key at all
    };

    const result = await main(params);

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/invalid "id" or "updates"/i);
  });
  
  test('returns 400 for invalid date format', async () => {
    const params = {
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'notif-1',
        updates: {
          start: 'not-a-date',
          end: 'not-a-date'
        }
      }
    };

    const result = await main(params);

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/invalid date format/i);
  });

  test('returns 400 on overlapping notification', async () => {
    const params = {
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'notif-2',
        updates: {
          position: 'Header',
          start: '2025-08-01T09:00:00Z',
          end: '2025-08-01T11:00:00Z'
        }
      }
    };

    const existing = [
      {
        id: 'notif-1',
        position: 'Header',
        start: '2025-08-01T08:00:00Z',
        end: '2025-08-01T10:30:00Z'
      }
    ];

    mockState.get.mockResolvedValue({ value: JSON.stringify(existing) });

    const result = await main(params);

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/time window overlaps/i);
  });

  test('returns 400 if notification ID is not found', async () => {
    const params = {
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'missing-id',
        updates: {
          title: 'New Title',
          start: '2025-08-01T10:00:00Z',
          end: '2025-08-01T11:00:00Z'
        }
      }
    };

    const existing = [
      { id: 'some-other-id', title: 'Some Title', start: '2025-08-01T09:00:00Z', end: '2025-08-01T10:00:00Z' }
    ];

    mockState.get.mockResolvedValue({ value: JSON.stringify(existing) });

    const result = await main(params);

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/not found/i);
  });

  test('returns 400 if no notifications in state', async () => {
    mockState.get.mockResolvedValue({});

    const params = {
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'notif-1',
        updates: {
          title: 'New Title',
          start: '2025-08-01T10:00:00Z',
          end: '2025-08-01T11:00:00Z'
        }
      }
    };

    const result = await main(params);

    expect(result.error.statusCode).toBe(400);
    expect(result.error.body.error).toMatch(/no notifications found/i);
  });

  test('returns 500 on internal error', async () => {
    mockState.get.mockRejectedValue(new Error('Unexpected failure'));

    const params = {
      __ow_headers: { authorization: 'Bearer token' },
      data: {
        id: 'notif-1',
        updates: {
          title: 'New Title',
          start: '2025-08-01T10:00:00Z',
          end: '2025-08-01T11:00:00Z'
        }
      }
    };

    const result = await main(params);

    expect(result.error.statusCode).toBe(500);
    expect(result.error.body.error).toMatch(/server error/i);
  });
});
