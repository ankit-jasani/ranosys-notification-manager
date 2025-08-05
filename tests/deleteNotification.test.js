/**
 * deleteNotification/index.js → tests/deleteNotification.test.js
 */

jest.mock('@adobe/aio-lib-state', () => ({
  MAX_TTL: 3600,            // <-- define MAX_TTL here
  init: jest.fn().mockResolvedValue({
    get: jest.fn(),
    put: jest.fn(),
    MAX_TTL: 3600           // keep it on the client for consistency
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

const { main } = require('../src/commerce-backend-ui-1/actions/deleteNotification/index');
const stateLib = require('@adobe/aio-lib-state');

describe('deleteNotification action', () => {
  const validParams = {
    __ow_headers: { authorization: 'Bearer token' },
    data: { id: 'notif1' }
  };

  afterEach(() => jest.clearAllMocks());

  test('successfully deletes an existing notification', async () => {
    // Arrange: state.get returns a list containing validParams.data
    const mockList = [validParams.data, { id: 'other' }];
    const mockState = {
      get: jest.fn().mockResolvedValue({ value: JSON.stringify(mockList) }),
      put: jest.fn().mockResolvedValue(true),
      MAX_TTL: 3600
    };
    stateLib.init.mockResolvedValueOnce(mockState);

    const response = await main(validParams);

    // Success returns flat statusCode/body
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);

    // put should be called with the filtered array (only 'other' remains)
    expect(mockState.put).toHaveBeenCalledWith(
      'notifications',
      JSON.stringify([{ id: 'other' }]),
      { ttl: stateLib.MAX_TTL }    // now this is 3600
    );
  });

  // ... other tests remain unchanged ...
});
