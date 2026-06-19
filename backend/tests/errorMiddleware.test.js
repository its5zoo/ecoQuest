const { errorHandler } = require('../src/middleware/errorMiddleware');

describe('errorHandler', () => {
  const createMocks = (statusCode = 500, nodeEnv = 'development') => {
    const err = new Error('Something went wrong');
    err.stack = 'Error: Something went wrong\n    at test.js:1:1';

    const req = {};
    const res = {
      statusCode,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = nodeEnv;

    return { err, req, res, next, restore: () => { process.env.NODE_ENV = originalEnv; } };
  };

  it('returns error message and stack in development', () => {
    const { err, req, res, next, restore } = createMocks(500, 'development');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Something went wrong',
      stack: err.stack,
    });
    restore();
  });

  it('hides stack trace in production', () => {
    const { err, req, res, next, restore } = createMocks(400, 'production');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Something went wrong',
      stack: null,
    });
    restore();
  });

  it('defaults to 500 when response has no statusCode', () => {
    const { err, req, res, next, restore } = createMocks(undefined, 'test');
    res.statusCode = undefined;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    restore();
  });
});
