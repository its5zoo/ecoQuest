const { getJwtSecret, requireSecret } = require('../src/config/secrets');

describe('secrets config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns dev fallback when JWT_SECRET missing in development', () => {
    delete process.env.JWT_SECRET;
    expect(getJwtSecret()).toContain('dev-only');
  });

  it('throws in production without JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET is required');
  });

  it('requireSecret returns null in development when missing', () => {
    delete process.env.JWT_SECRET;
    expect(requireSecret('JWT_SECRET')).toBeNull();
  });
});
