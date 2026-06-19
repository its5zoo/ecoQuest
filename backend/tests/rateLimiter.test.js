const { authLimiter, aiLimiter } = require('../src/middleware/rateLimiter');

describe('rateLimiter exports', () => {
  it('exports configured auth and ai limiters', () => {
    expect(typeof authLimiter).toBe('function');
    expect(typeof aiLimiter).toBe('function');
  });
});
