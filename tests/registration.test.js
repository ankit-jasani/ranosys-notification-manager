// tests/registration.test.js

const { main } = require('../src/commerce-backend-ui-1/actions/registration');

describe('registration main()', () => {
  it('should return statusCode 200 with correct registration structure', async () => {
    const result = await main();

    expect(result).toBeDefined();
    expect(result.statusCode).toBe(200);

    const { body } = result;
    expect(body).toHaveProperty('registration');

    const { registration } = body;

    expect(registration).toHaveProperty('menuItems');
    expect(Array.isArray(registration.menuItems)).toBe(true);

    expect(registration.menuItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringContaining('ranosysnotificationmanager::'),
          title: expect.any(String),
          sortOrder: expect.any(Number),
        }),
      ])
    );

    expect(registration).toHaveProperty('page');
    expect(registration.page).toHaveProperty('title', 'Notification Manager');
  });
});
