jest.mock('mongoose', () => {
  const schema = { paths: {} };
  const defaultModel = { schema };
  const userModel = { modelName: 'UserScopedModel' };

  return {
    model: jest.fn(() => defaultModel),
    connection: {
      useDb: jest.fn(() => ({
        model: jest.fn(() => userModel),
      })),
    },
  };
});

const mongoose = require('mongoose');
const { getModelForUser } = require('../src/utils/dbHelper');

describe('getModelForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the default model when userId is missing', () => {
    const model = getModelForUser(undefined, 'Activity');
    expect(mongoose.model).toHaveBeenCalledWith('Activity');
    expect(model.schema).toBeDefined();
  });

  it('creates a user-specific model on first access', () => {
    const userId = '507f1f77bcf86cd799439011';
    const model = getModelForUser(userId, 'ScoreHistory');

    expect(mongoose.connection.useDb).toHaveBeenCalledWith(`usr_${userId}`, { useCache: true });
    expect(model).toBeDefined();
  });

  it('returns the cached user-specific model on subsequent calls', () => {
    const userId = 'cache-user-id-123';
    const first = getModelForUser(userId, 'EnvChat');
    const useDbCalls = mongoose.connection.useDb.mock.calls.length;
    const second = getModelForUser(userId, 'EnvChat');

    expect(first).toBe(second);
    expect(mongoose.connection.useDb.mock.calls.length).toBe(useDbCalls);
  });
});
