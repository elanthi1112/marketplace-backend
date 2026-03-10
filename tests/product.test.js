const request = require('supertest');
const app = require('../src/app');

const registerAndLogin = async (payload) => {
  const res = await request(app).post('/api/auth/register').send(payload);
  return res.body.token;
};

describe('Product Endpoints', () => {
  let sellerToken;
  let buyerToken;

  const sellerPayload = {
    name: 'Seller User',
    email: 'seller@example.com',
    password: 'password123',
    role: 'seller',
  };

  const buyerPayload = {
    name: 'Buyer User',
    email: 'buyer@example.com',
    password: 'password123',
    role: 'buyer',
  };

  const productData = {
    title: 'Test Product',
    description: 'A great product for testing',
    price: 29.99,
    category: 'Electronics',
    stock: 10,
  };

  beforeEach(async () => {
    sellerToken = await registerAndLogin(sellerPayload);
    buyerToken = await registerAndLogin(buyerPayload);
  });

  describe('GET /api/products', () => {
    it('should return product list (empty initially)', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(Array.isArray(res.body.products)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should allow seller to create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(productData.title);
      expect(res.body.price).toBe(productData.price);
    });

    it('should reject unauthenticated product creation', async () => {
      const res = await request(app).post('/api/products').send(productData);
      expect(res.status).toBe(401);
    });

    it('should reject buyer creating product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(productData);
      expect(res.status).toBe(403);
    });

    it('should reject product with missing fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ title: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);
      productId = res.body._id;
    });

    it('should return a single product', async () => {
      const res = await request(app).get(`/api/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(productId);
    });

    it('should return 404 for nonexistent product', async () => {
      const res = await request(app).get('/api/products/64a0000000000000000000ab');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);
      productId = res.body._id;
    });

    it('should allow seller to update own product', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 49.99 });
      expect(res.status).toBe(200);
      expect(res.body.price).toBe(49.99);
    });

    it('should reject buyer updating product', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ price: 49.99 });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);
      productId = res.body._id;
    });

    it('should allow seller to delete own product', async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      const res = await request(app).get(`/api/products/${productId}`);
      expect(res.status).toBe(404);
    });
  });
});
