const request = require('supertest');
const app = require('../src/app');

describe('Auth Endpoints', () => {
  const sellerPayload = {
    name: 'Alice Seller',
    email: 'alice@example.com',
    password: 'password123',
    role: 'seller',
  };

  const buyerPayload = {
    name: 'Bob Buyer',
    email: 'bob@example.com',
    password: 'password123',
    role: 'buyer',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app).post('/api/auth/register').send(buyerPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', buyerPayload.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should register a seller', async () => {
      const res = await request(app).post('/api/auth/register').send(sellerPayload);
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('seller');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(buyerPayload);
      const res = await request(app).post('/api/auth/register').send(buyerPayload);
      expect(res.status).toBe(409);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...buyerPayload, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...buyerPayload, email: 'new@example.com', password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(buyerPayload);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: buyerPayload.email, password: buyerPayload.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(buyerPayload.email);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: buyerPayload.email, password: 'wrongpassword' });
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
