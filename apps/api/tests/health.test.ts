import { describe, expect, it } from 'vitest';
import request from 'supertest';

process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASS = 'root';
process.env.DB_NAME = 'finlovi';
process.env.WEB_ORIGIN = '*';
process.env.AUTH_ENABLED = 'false';

const { app } = await import('../src/app.js');

describe('health', () => {
  it('responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns auth disabled on login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'test' });
    expect(res.status).toBe(501);
  });
});
