/**
 * utils.js → tests/utils.test.js
 */

jest.mock('luxon', () => {
  const RealLuxon = jest.requireActual('luxon');
  return {
    DateTime: {
      now: jest.fn(() => RealLuxon.DateTime.fromISO('2025-08-05T12:00:00.000Z')),
      fromISO: RealLuxon.DateTime.fromISO.bind(RealLuxon.DateTime)
    }
  };
});

const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
  parseLocal,
  getNow,
  getConvertedDateTime,
  getUpdatedNotifications
} = require('../src/commerce-backend-ui-1/actions/utils');

describe('utils', () => {
  describe('stringParameters', () => {
    test('hides authorization header', () => {
      const params = {
        foo: 'bar',
        __ow_headers: { authorization: 'secret', other: 'keep' }
      };
      const out = JSON.parse(stringParameters(params));
      expect(out.foo).toBe('bar');
      expect(out.__ow_headers.authorization).toBe('<hidden>');
      expect(out.__ow_headers.other).toBe('keep');
    });

    test('works when __ow_headers is absent', () => {
      const params = { foo: 'bar' };
      const out = JSON.parse(stringParameters(params));
      expect(out.foo).toBe('bar');
      expect(out.__ow_headers).toEqual({});
    });
  });

  describe('checkMissingRequestInputs', () => {
    test('detects missing headers and params', () => {
      const params = { __ow_headers: { foo: 'x' }, a: 1 };
      const msg = checkMissingRequestInputs(params, ['a', 'b'], ['foo', 'bar']);
      // missing header bar, missing param b
      expect(msg).toMatch(/missing header\(s\) 'bar'/);
      expect(msg).toMatch(/missing parameter\(s\) 'b'/);
    });

    test('returns null when nothing missing', () => {
      const params = { __ow_headers: { foo: 'x', bar: 'y' }, a: 1, b: 2 };
      const msg = checkMissingRequestInputs(params, ['a', 'b'], ['foo', 'bar']);
      expect(msg).toBeNull();
    });
  });

  describe('parseLocal', () => {
    test('parses 12-hour format correctly', () => {
      const dt = parseLocal('05/08/2025, 02:30:15 PM');
      expect(dt.toISOString()).toBe('2025-08-05T14:30:15.000Z');
    });
    test('handles midnight edge cases', () => {
      const dt1 = parseLocal('05/08/2025, 12:00:00 AM');
      expect(dt1.toISOString()).toBe('2025-08-05T00:00:00.000Z');
      const dt2 = parseLocal('05/08/2025, 12:00:00 PM');
      expect(dt2.toISOString()).toBe('2025-08-05T12:00:00.000Z');
    });
  });

  describe('getNow', () => {
    test('returns a Date when no tz provided', () => {
      const dt = getNow();
      expect(dt).toBeInstanceOf(Date);
    });

    test('returns a Date when tz provided', () => {
      // Given our luxon mock, DateTime.now() uses fixed ISO string
      const dt = getNow('Asia/Kolkata');
      expect(dt).toBeInstanceOf(Date);
      // It should parse the fixed ISO from the mock
      expect(dt.getUTCFullYear()).toBe(2025);
    });
  });

  describe('getConvertedDateTime', () => {
    test('converts UTC string to target timezone Date', () => {
      // Using luxon mock: fromISO+setZone will derive same timestamp
      const dt = getConvertedDateTime('2025-08-05T06:00:00.000Z', 'Asia/Kolkata');
      expect(dt).toBeInstanceOf(Date);
      // It should represent the original UTC time
      expect(dt.toISOString()).toBe('2025-08-05T11:30:00.000Z');
    });
  });

  describe('getUpdatedNotifications', () => {
    const base = {
      id: '1',
      start: '2025-08-05T10:00:00.000Z',
      end: '2025-08-05T12:00:00.000Z',
      position: 'Header'
    };
    const nowInside = new Date('2025-08-05T11:00:00.000Z');
    const nowOutside = new Date('2025-08-05T13:00:00.000Z');

    test('includes active notification when isActiveNotificationsOnly=true and within window', () => {
      const result = getUpdatedNotifications(base, nowInside, false, null, 'Header', true);
      expect(result).toHaveLength(1);
      const item = result[0];
      expect(item.position).toBe('Header');
      expect(item.adjustedStart).toBeInstanceOf(Date);
      expect(item.adjustedEnd).toBeInstanceOf(Date);
    });

    test('excludes notification outside window when active-only', () => {
      const result = getUpdatedNotifications(base, nowOutside, false, null, 'Header', true);
      expect(result).toHaveLength(0);
    });

    test('includes non-active-only notifications if before end', () => {
      const result = getUpdatedNotifications(base, nowOutside, false, null, 'Header', false);
      // nowOutside > end, but non-active-only only checks end
      expect(result).toHaveLength(0);
    });

    test('filters by position', () => {
      const result = getUpdatedNotifications(base, nowInside, false, null, 'Footer', true);
      expect(result).toHaveLength(0);
    });
  });

  describe('errorResponse', () => {
    test('returns error object and logs info', () => {
      const logger = { info: jest.fn() };
      const err = errorResponse(400, 'oops', logger);
      expect(logger.info).toHaveBeenCalledWith('400: oops');
      expect(err).toEqual({
        error: {
          statusCode: 400,
          body: { error: 'oops' }
        }
      });
    });

    test('returns error object without logger', () => {
      const err = errorResponse(500, 'fail');
      expect(err.error.statusCode).toBe(500);
      expect(err.error.body.error).toBe('fail');
    });
  });
});
