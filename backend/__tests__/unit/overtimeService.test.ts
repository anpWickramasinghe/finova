import { calculateOvertime } from '../../services/overtimeService.js';
import { db } from '../../config/db.js';

jest.mock('../../config/db.js', () => ({
    db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn()
    }
}));

describe('Overtime Service - Unit Tests', () => {
    let mockLimit1: jest.Mock;
    let mockLimit2: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLimit1 = jest.fn();
        mockLimit2 = jest.fn();
        (db as any).select = jest.fn(() => ({
            from: jest.fn(() => ({
                limit: mockLimit1,
                where: jest.fn(() => ({
                    limit: mockLimit2
                }))
            }))
        }));
    });

    it('should calculate 0 overtime if working exact schedule (09:00 - 17:00)', async () => {
        // Mock Settings
        mockLimit1.mockResolvedValueOnce([{ minOvertimeMinutes: '30' }]);
        // Mock Holiday (not a holiday)
        mockLimit2.mockResolvedValueOnce([]);

        // A regular Wednesday
        const recordDate = new Date('2026-05-13T00:00:00'); // Wed
        const checkIn = new Date('2026-05-13T09:00:00');
        const checkOut = new Date('2026-05-13T17:00:00');

        const result = await calculateOvertime('user1', checkIn, checkOut, recordDate);

        expect(result.calculatedMinutes).toBe(0);
        expect(result.isHoliday).toBe(false);
        expect(result.isWeekend).toBe(false);
        expect(result.status).toBe('None');
    });

    it('should calculate overtime if working late beyond the threshold', async () => {
        // Mock Settings
        mockLimit1.mockResolvedValueOnce([{ minOvertimeMinutes: '30' }]);
        // Mock Holiday
        mockLimit2.mockResolvedValueOnce([]);

        const recordDate = new Date('2026-05-13T00:00:00');
        const checkIn = new Date('2026-05-13T09:00:00');
        // Worked until 18:00 (1 hour overtime)
        const checkOut = new Date('2026-05-13T18:00:00');

        const result = await calculateOvertime('user1', checkIn, checkOut, recordDate);

        expect(result.calculatedMinutes).toBe(60);
        expect(result.status).toBe('Pending');
    });

    it('should not count overtime if the extra time is below threshold', async () => {
        mockLimit1.mockResolvedValueOnce([{ minOvertimeMinutes: '30' }]);
        mockLimit2.mockResolvedValueOnce([]);

        const recordDate = new Date('2026-05-13T00:00:00');
        const checkIn = new Date('2026-05-13T09:00:00');
        // Worked until 17:15 (15 mins overtime, threshold is 30)
        const checkOut = new Date('2026-05-13T17:15:00');

        const result = await calculateOvertime('user1', checkIn, checkOut, recordDate);

        expect(result.calculatedMinutes).toBe(0);
        expect(result.status).toBe('None');
    });

    it('should count the entire duration as overtime on weekends', async () => {
        mockLimit1.mockResolvedValueOnce([{ minOvertimeMinutes: '30' }]);
        mockLimit2.mockResolvedValueOnce([]);

        // A Saturday
        const recordDate = new Date('2026-05-16T00:00:00');
        const checkIn = new Date('2026-05-16T10:00:00');
        const checkOut = new Date('2026-05-16T14:00:00'); // 4 hours

        const result = await calculateOvertime('user1', checkIn, checkOut, recordDate);

        expect(result.calculatedMinutes).toBe(240); // 4 hours * 60
        expect(result.isWeekend).toBe(true);
        expect(result.status).toBe('Pending');
    });
});
