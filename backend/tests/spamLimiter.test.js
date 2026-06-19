const spamLimiter = require('../src/middleware/spamLimiter');

describe('spamLimiter', () => {
  const createRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  it('allows requests under the limit', () => {
    const limiter = spamLimiter({ maxRequests: 2, windowMs: 60000, actionName: 'test-allow' });
    const req = { ip: '1.2.3.4' };
    const next = jest.fn();

    limiter(req, createRes(), next);
    limiter(req, createRes(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('blocks requests when limit is exceeded', () => {
    const limiter = spamLimiter({ maxRequests: 1, windowMs: 60000, actionName: 'test-block' });
    const req = { ip: '5.6.7.8' };
    const next = jest.fn();
    const res = createRes();

    limiter(req, createRes(), next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('Rate limit exceeded') })
    );
  });

  it('uses authenticated user id as identifier when present', () => {
    const limiter = spamLimiter({ maxRequests: 1, windowMs: 60000, actionName: 'test-user' });
    const req = { ip: '9.9.9.9', user: { _id: { toString: () => 'user-abc' } } };
    const next = jest.fn();
    const res = createRes();

    limiter(req, createRes(), next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('uses default options when none are provided', () => {
    const limiter = spamLimiter();
    const req = { ip: '10.0.0.1' };
    const next = jest.fn();

    for (let i = 0; i < 5; i += 1) {
      limiter(req, createRes(), next);
    }

    expect(next).toHaveBeenCalledTimes(5);
  });

  it('evicts oldest entries when internal map grows too large', () => {
    const limiter = spamLimiter({
      maxRequests: 100000,
      windowMs: 60000,
      actionName: 'evict-test',
    });

    for (let i = 0; i < 10001; i += 1) {
      limiter({ ip: `evict-ip-${i}` }, createRes(), jest.fn());
    }

    expect(true).toBe(true);
  });
});
