import request from 'supertest';
import { app, httpServer } from '../server.js';
import { db } from '../db/index.js';

// Mock DB connection to avoid real DB queries and connection issues during test
jest.mock('../db/index.js', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  }
}));

describe('Backend API Endpoints Check', () => {
  const endpoints = [
    { method: 'GET', url: '/', expectedStatus: [200] },
    
    // Branches
    { method: 'POST', url: '/api/branches/login', expectedStatus: [400, 500, 200] },
    { method: 'GET', url: '/api/branches', expectedStatus: [401] },
    { method: 'POST', url: '/api/branches', expectedStatus: [401] },
    
    // Attendance
    { method: 'GET', url: '/api/attendance', expectedStatus: [401] },
    { method: 'POST', url: '/api/attendance/check-in', expectedStatus: [401] },
    
    // Leaves
    { method: 'GET', url: '/api/leaves', expectedStatus: [401] },
    { method: 'POST', url: '/api/leaves', expectedStatus: [401] },
    
    // Payroll
    { method: 'GET', url: '/api/payroll/employees/1', expectedStatus: [401] },
    
    // Transactions
    { method: 'GET', url: '/api/transactions', expectedStatus: [401] },
    
    // Chat
    { method: 'GET', url: '/api/chat/messages/1', expectedStatus: [401] },
    
    // Stripe
    { method: 'POST', url: '/api/stripe/create-checkout-session', expectedStatus: [401] },
    
    // Forecasting
    { method: 'GET', url: '/api/forecasting/predict?days=30', expectedStatus: [401, 200, 500] },
  ];

  endpoints.forEach(({ method, url, expectedStatus }) => {
    it(`should have endpoint ${method} ${url} mounted (not return 404 unless expected)`, async () => {
      let response;
      if (method === 'GET') {
        response = await request(app).get(url);
      } else if (method === 'POST') {
        response = await request(app).post(url).send({});
      } else if (method === 'PUT') {
        response = await request(app).put(url).send({});
      } else if (method === 'DELETE') {
        response = await request(app).delete(url);
      }

      // We mainly want to ensure it's not a 404 (Not Found).
      // If it's a 401, it means the route exists and auth middleware blocked it.
      // If it's a 400 or 500, the controller was hit but failed (due to missing body/DB).
      expect(response?.status).not.toBe(404);
      if (expectedStatus.length > 0) {
        expect(expectedStatus).toContain(response?.status);
      }
    });
  });

  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app).get('/api/unknown-endpoint-xyz');
    expect(response.status).toBe(404);
  });
});
