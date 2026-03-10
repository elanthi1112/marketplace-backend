const request = require('supertest');
const app = require('../src/app');

const registerAndLogin = async (payload) => {
  const res = await request(app).post('/api/auth/register').send(payload);
  return res.body.token;
};

describe('Service Endpoints', () => {
  let professionalToken;
  let userToken;

  const professionalPayload = {
    name: 'Professional User',
    email: 'professional@example.com',
    password: 'password123',
    role: 'professional',
  };

  const userPayload = {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password123',
    role: 'user',
  };

  const serviceData = {
    title: 'Web Development',
    description: 'Full-stack web development services',
    price: 75,
    priceType: 'hourly',
    category: 'Technology',
  };

  beforeEach(async () => {
    professionalToken = await registerAndLogin(professionalPayload);
    userToken = await registerAndLogin(userPayload);
  });

  describe('GET /api/services', () => {
    it('should return service list (empty initially)', async () => {
      const res = await request(app).get('/api/services');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('services');
      expect(Array.isArray(res.body.services)).toBe(true);
    });
  });

  describe('POST /api/services', () => {
    it('should allow professional to create service', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(serviceData);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(serviceData.title);
      expect(res.body.price).toBe(serviceData.price);
      expect(res.body.priceType).toBe('hourly');
    });

    it('should reject unauthenticated service creation', async () => {
      const res = await request(app).post('/api/services').send(serviceData);
      expect(res.status).toBe(401);
    });

    it('should reject user (non-professional) creating service', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${userToken}`)
        .send(serviceData);
      expect(res.status).toBe(403);
    });

    it('should reject service with missing fields', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({ title: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/services/:id', () => {
    let serviceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(serviceData);
      serviceId = res.body._id;
    });

    it('should return a single service', async () => {
      const res = await request(app).get(`/api/services/${serviceId}`);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(serviceId);
    });

    it('should return 404 for nonexistent service', async () => {
      const res = await request(app).get('/api/services/64a0000000000000000000ab');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/services/:id', () => {
    let serviceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(serviceData);
      serviceId = res.body._id;
    });

    it('should allow professional to update own service', async () => {
      const res = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({ price: 100 });
      expect(res.status).toBe(200);
      expect(res.body.price).toBe(100);
    });

    it('should reject user updating service', async () => {
      const res = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 100 });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/services/:id', () => {
    let serviceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(serviceData);
      serviceId = res.body._id;
    });

    it('should allow professional to delete own service', async () => {
      const res = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${professionalToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${professionalToken}`);
      const res = await request(app).get(`/api/services/${serviceId}`);
      expect(res.status).toBe(404);
    });
  });
});
