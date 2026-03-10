const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  const professionalPayload = {
    name: 'Alice Professional',
    email: 'alice@example.com',
    password: 'password123',
    role: 'professional',
  };

  const userPayload = {
    name: 'Bob User',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app).post('/api/auth/register').send(userPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', userPayload.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should register a professional', async () => {
      const res = await request(app).post('/api/auth/register').send(professionalPayload);
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('professional');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(userPayload);
      const res = await request(app).post('/api/auth/register').send(userPayload);
      expect(res.status).toBe(409);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userPayload, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userPayload, email: 'new@example.com', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userPayload);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userPayload.email, password: userPayload.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(userPayload.email);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userPayload.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should reject unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });
});
