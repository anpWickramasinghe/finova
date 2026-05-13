import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { getPayrollRecords, updatePayrollStatus } from '../../controllers/payrollController.js';
import { db } from '../../config/db.js';

jest.mock('../../config/db.js', () => {
    const mockLimit = jest.fn();
    const mockWhere = jest.fn(() => ({
        limit: mockLimit
    }));

    return {
        db: {
            select: jest.fn(() => ({
                from: jest.fn(() => ({
                    leftJoin: jest.fn(() => ({
                        where: mockWhere
                    })),
                    where: mockWhere,
                    limit: mockLimit
                }))
            })),
            update: jest.fn(() => ({
                set: jest.fn(() => ({
                    where: jest.fn()
                }))
            })),
            _mockWhere: mockWhere,
            _mockLimit: mockLimit
        }
    };
});

// Create a test app with mock review routes
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Basic middleware to mock user
    app.use((req: any, res, next) => {
        req.user = { id: 'admin123' };
        next();
    });

    // Mount controller routes
    app.get("/payroll", getPayrollRecords);
    app.put("/payroll/:id/status", updatePayrollStatus);

    app.use((req, res) => {
        res.status(404).json({ message: "Route not found" });
    });

    return app;
};

describe("PayrollRoutes - Integration Tests", () => {
    let app: express.Application;

    beforeEach(() => {
        jest.clearAllMocks();
        app = createTestApp();
    });

    describe("GET /payroll", () => {
        it("should return payroll records successfully", async () => {
            const mockRecords = [{ id: "pay-1", userId: "user-1", netSalary: "5000.00" }];
            (db as any)._mockWhere.mockResolvedValueOnce(mockRecords);

            const response = await request(app).get("/payroll");

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty("id", "pay-1");
        });

        it("should handle database errors safely", async () => {
            (db as any)._mockWhere.mockRejectedValueOnce(new Error("DB Error"));

            const response = await request(app).get("/payroll");

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Internal server error");
        });
    });

    describe("PUT /payroll/:id/status", () => {
        it("should return 400 when an invalid status is provided", async () => {
            const response = await request(app).put("/payroll/pay-1/status").send({ status: 'InvalidStatus' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid status");
        });

        it("should return 404 if the payroll record is not found", async () => {
            (db as any)._mockLimit.mockResolvedValueOnce([]); // DB returns nothing
            
            const response = await request(app).put("/payroll/pay-999/status").send({ status: 'Approved' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Not found");
        });

        it("should update status successfully with valid data", async () => {
            (db as any)._mockLimit.mockResolvedValueOnce([{ id: 'pay-1', status: 'Draft' }]);
            
            const response = await request(app).put("/payroll/pay-1/status").send({ status: 'Approved' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Status updated to Approved");
        });
    });
});
