import { Request, Response } from 'express';
import { checkIn } from '../../controllers/attendanceController.js';
import { db } from '../../config/db.js';

// Mock DB connection
jest.mock('../../config/db.js', () => {
    const mockLimit = jest.fn();
    const mockWhere = jest.fn(() => ({ limit: mockLimit }));
    return {
        db: {
            select: jest.fn(() => ({
                from: jest.fn(() => ({
                    where: mockWhere
                }))
            })),
            insert: jest.fn(() => ({
                values: jest.fn()
            })),
            update: jest.fn(() => ({
                set: jest.fn()
            })),
            // Expose the mock limit for tests
            _mockLimit: mockLimit
        }
    };
});

describe('Attendance Controller - Integration Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {}
        };
    });

    it('should return 401 if user is not authenticated', async () => {
        mockRequest = { user: undefined } as any;

        await checkIn(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should successfully check in a user', async () => {
        mockRequest = { user: { id: 'user123' } } as any;

        // Mock DB: No existing check-in today
        (db as any)._mockLimit.mockResolvedValueOnce([]);

        await checkIn(mockRequest as Request, mockResponse as Response);

        expect(db.insert).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Checked in successfully' });
    });

    it('should return 400 if user is already checked in', async () => {
        mockRequest = { user: { id: 'user123' } } as any;

        // Mock DB: Existing check-in today
        (db as any)._mockLimit.mockResolvedValueOnce([
            { id: 'record123', checkInTime: new Date() }
        ]);

        await checkIn(mockRequest as Request, mockResponse as Response);

        expect(db.insert).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Already checked in for today' });
    });
});
