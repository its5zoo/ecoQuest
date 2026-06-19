jest.mock('mongoose', () => {
  const schema = { paths: {} };
  const defaultModel = { schema };

  return {
    model: jest.fn(() => defaultModel),
  };
});

const mongoose = require('mongoose');
const { getModelForUser } = require('../src/utils/dbHelper');

describe('getModelForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the default model directly', () => {
    const model = getModelForUser('some-user-id', 'Activity');
    expect(mongoose.model).toHaveBeenCalledWith('Activity');
    expect(model.schema).toBeDefined();
  });

  it('returns the default model when userId is missing', () => {
    const model = getModelForUser(undefined, 'Activity');
    expect(mongoose.model).toHaveBeenCalledWith('Activity');
    expect(model.schema).toBeDefined();
  });
});

