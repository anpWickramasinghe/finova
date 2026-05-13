import { Request, Response } from 'express';
import { loginBranch, connectBranchStripe } from '../../controllers/branchController.js';
import { db } from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createConnectedTestAccount } from '../../services/stripeService.js';

// Setup basic mocks
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../services/stripeService.js');

jest.mock('../../config/db.js', () => {
    const mockWhere = jest.fn();
    return {
        db: {
            select: jest.fn(() => ({
                from: jest.fn(() => ({
                    where: mockWhere
                }))
            })),
            update: jest.fn(() => ({
                set: jest.fn(() => ({
                    where: jest.fn()
                }))
            })),
            _mockWhere: mockWhere
        }
    };
});

describe('Branch Controller - Unit Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('loginBranch', () => {
        it('should return 401 for invalid email', async () => {
            mockRequest = { body: { email: 'wrong@test.com', password: 'pass' } } as any;
            (db as any)._mockWhere.mockResolvedValueOnce([]); // No branch found

            await loginBranch(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return 401 for invalid password', async () => {
            mockRequest = { body: { email: 'branch@test.com', password: 'wrong' } } as any;
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: '1', email: 'branch@test.com', password: 'hashed' }]);
            
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false); // Password mismatch

            await loginBranch(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return token and branch details on successful login', async () => {
            mockRequest = { body: { email: 'branch@test.com', password: 'pass' } } as any;
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: '1', name: 'Main', email: 'branch@test.com', password: 'hashed' }]);
            
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
            (jwt.sign as jest.Mock).mockReturnValueOnce('mocked_token');

            await loginBranch(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                token: 'mocked_token',
                user: {
                    id: '1',
                    name: 'Main',
                    email: 'branch@test.com',
                    role: 'branch'
                }
            });
        });
    });

    describe('connectBranchStripe', () => {
        it('should return 400 if branch already has a connected Stripe account', async () => {
            mockRequest = { params: { id: 'branch1' } } as any;
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: 'branch1', stripeAccountId: 'acct_123' }]);

            await connectBranchStripe(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Branch already has a connected Stripe Account' });
        });

        it('should connect Stripe account successfully', async () => {
            mockRequest = { params: { id: 'branch1' } } as any;
            
            // First call to fetch the branch
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: 'branch1', email: 'branch1@test.com' }]);
            
            // Mock stripe service
            (createConnectedTestAccount as jest.Mock).mockResolvedValueOnce({ id: 'new_acct_456' });

            // Second call fetches updated branch
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: 'branch1', stripeAccountId: 'new_acct_456' }]);

            await connectBranchStripe(mockRequest as Request, mockResponse as Response);

            expect(createConnectedTestAccount).toHaveBeenCalledWith('branch1@test.com');
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Stripe account connected successfully',
                branch: { id: 'branch1', stripeAccountId: 'new_acct_456' }
            });
        });
    });
});
