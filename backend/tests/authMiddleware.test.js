jest.mock('jsonwebtoken');
jest.mock('../src/models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../src/config/secrets', () => ({
  getJwtSecret: jest.fn(() => 'test-jwt-secret'),
}));

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { protect, optionalProtect } = require('../src/middleware/authMiddleware');

describe('protect', () => {
  const createRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.connection.readyState = 1;
  });

  it('rejects requests without a bearer token', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 when database is offline', async () => {
    jwt.verify.mockReturnValue({ id: 'user-id' });
    mongoose.connection.readyState = 0;

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Database is currently offline. Please try again later.',
    });
  });

  it('returns 401 when user is not found', async () => {
    jwt.verify.mockReturnValue({ id: 'missing-user' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('missing-user');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found, token invalid' });
  });

  it('calls next when token and user are valid', async () => {
    const mockUser = { _id: 'user-id', name: 'Test User' };
    jwt.verify.mockReturnValue({ id: 'user-id' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 for invalid or expired tokens', async () => {
    const invalidError = new Error('invalid token');
    invalidError.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw invalidError; });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
  });

  it('returns 401 for expired tokens', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw expiredError; });

    const req = { headers: { authorization: 'Bearer expired-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
  });

  it('returns 500 for unexpected authorization errors', async () => {
    const unexpectedError = new Error('database timeout');
    unexpectedError.name = 'MongoError';
    jwt.verify.mockImplementation(() => { throw unexpectedError; });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error during authorization' });
  });
});

describe('optionalProtect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('continues without user when no authorization header is present', async () => {
    const req = { headers: {} };
    const next = jest.fn();

    await optionalProtect(req, {}, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('continues without user when token verification fails', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('bad token'); });

    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const next = jest.fn();

    await optionalProtect(req, {}, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('continues without user when bearer token is empty', async () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const next = jest.fn();

    await optionalProtect(req, {}, next);

    expect(req.user).toBeUndefined();
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('attaches user when token is valid', async () => {
    const mockUser = { _id: 'user-id', name: 'Optional User' };
    jwt.verify.mockReturnValue({ id: 'user-id' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const next = jest.fn();

    await optionalProtect(req, {}, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
