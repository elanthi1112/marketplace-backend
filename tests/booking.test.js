const request = require('supertest');
const app = require('../src/app');

let userCounter = 0;

const registerAndLogin = async (baseName, role) => {
  userCounter++;
  const payload = {
    name: `${baseName} ${userCounter}`,
    email: `${baseName.toLowerCase().replace(' ', '')}${userCounter}@example.com`,
    password: 'password123',
    role,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.body)}`);
  return { token: res.body.token, userId: res.body.user._id };
};

describe('Booking Endpoints', () => {
  let clientToken;
  let professionalToken;
  let professionalId;

  beforeEach(async () => {
    const prof = await registerAndLogin('Professional', 'professional');
    professionalToken = prof.token;
    professionalId = prof.userId;
    const client = await registerAndLogin('Client', 'user');
    clientToken = client.token;
  });

  describe('POST /api/bookings', () => {
    it('should allow client to create a booking request', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          professional: professionalId,
          serviceTitle: 'Legal Consultation',
          notes: 'Need advice on contract',
          offeredPrice: 200,
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      expect(res.body.serviceTitle).toBe('Legal Consultation');
    });

    it('should reject unauthenticated booking creation', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ professional: professionalId, serviceTitle: 'Test' });
      expect(res.status).toBe(401);
    });

    it('should reject booking with missing professional', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ serviceTitle: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ professional: professionalId, serviceTitle: 'Consultation' });
    });

    it('should list bookings for client', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should list bookings for professional', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${professionalToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/bookings/:id/status', () => {
    let bookingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ professional: professionalId, serviceTitle: 'Consultation' });
      bookingId = res.body._id;
    });

    it('should allow professional to accept booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('accepted');
    });

    it('should allow professional to reject booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({ status: 'rejected' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
    });

    it('should allow client to cancel booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'cancelled', cancelReason: 'No longer needed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('should reject client trying to accept booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/bookings/:id/counter', () => {
    let bookingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ professional: professionalId, serviceTitle: 'Consultation', offeredPrice: 100 });
      bookingId = res.body._id;
    });

    it('should allow professional to counter-offer', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/counter`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({ price: 150, notes: 'My rate is higher' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('countered');
      expect(res.body.counterOffer.price).toBe(150);
    });

    it('should reject client trying to counter-offer', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/counter`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ price: 150 });
      expect(res.status).toBe(403);
    });
  });
});
