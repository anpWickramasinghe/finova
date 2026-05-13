import { Request, Response } from 'express';
import { getUsers, deleteUser } from '../../controllers/adminController.js';
import { db } from '../../config/db.js';

jest.mock('../../config/db.js', () => {
    const mockWhere = jest.fn();
    const mockDeleteWhere = jest.fn();
    
    return {
        db: {
            select: jest.fn(() => ({
                from: jest.fn(() => ({
                    where: mockWhere
                })),
                where: mockWhere // Fallback for simple selects
            })),
            update: jest.fn(() => ({
                set: jest.fn(() => ({
                    where: jest.fn()
                }))
            })),
            delete: jest.fn(() => ({
                where: mockDeleteWhere
            })),
            _mockWhere: mockWhere,
            _mockDeleteWhere: mockDeleteWhere
        }
    };
});

// Since the controller references auth from '../auth.js' we must mock it too
jest.mock('../../auth.js', () => ({
    auth: {
        api: {
            signUpEmail: jest.fn()
        }
    }
}));

describe('Admin Controller - Integration Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getUsers', () => {
        it('should return all users if no role filter provided', async () => {
            mockRequest = { query: {} } as any;
            
            // Mocking db.select().from(user) to act as a promise resolving an array
            (db as any).select.mockReturnValueOnce({
                from: jest.fn().mockResolvedValueOnce([{ id: 1, name: 'John Doe' }])
            });

            await getUsers(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1, name: 'John Doe' }]);
        });

        it('should return 500 if database query fails', async () => {
            mockRequest = { query: {} } as any;
            (db as any).select.mockReturnValueOnce({
                from: jest.fn().mockRejectedValueOnce(new Error('DB Error'))
            });

            await getUsers(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'DB Error' });
        });
    });

    describe('deleteUser', () => {
        it('should delete a user and their sessions/accounts successfully', async () => {
            mockRequest = { params: { id: 'user123' } } as any;

            // Mock finding the user first
            (db as any)._mockWhere.mockResolvedValueOnce([{ id: 'user123', role: 'Employee', branchId: null }]);
            // Mock deletes
            (db as any)._mockDeleteWhere.mockResolvedValue(true);

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(db.delete).toHaveBeenCalledTimes(3); // session, account, user
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
        });

        it('should gracefully handle deletion when user is not found', async () => {
            mockRequest = { params: { id: 'unknown' } } as any;

            // Mock finding the user: not found
            (db as any)._mockWhere.mockResolvedValueOnce([]);
            
            (db as any)._mockDeleteWhere.mockResolvedValue(true);

            await deleteUser(mockRequest as Request, mockResponse as Response);

            expect(db.delete).toHaveBeenCalledTimes(3); // It still issues deletes, which do nothing if no records match
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
        });
    });
});
