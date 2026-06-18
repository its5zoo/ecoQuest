const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

const app = require('../src/app');

describe('Health endpoint', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth validation', () => {
  it('rejects signup without required fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('rejects login without password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('Protected AI routes', () => {
  it('requires auth for AI chat', async () => {
    const res = await request(app).post('/api/ai/chat').send({ messages: [] });
    expect(res.status).toBe(401);
  });
});

describe('Env-chat routes', () => {
  it('allows guest to post env-chat and enforces limits', async () => {
    await request(app).post('/api/env-chat').send({ question: 'Question 1' });
    await request(app).post('/api/env-chat').send({ question: 'Question 2' });
    const res = await request(app).post('/api/env-chat').send({ question: 'Question 3' });
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Guest limit reached');
  });
});
