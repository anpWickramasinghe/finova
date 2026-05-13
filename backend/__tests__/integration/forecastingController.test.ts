import { Request, Response } from 'express';
import axios from 'axios';
import { getCashFlowPrediction } from '../../controllers/forecastingController.js';

// Mock axios
jest.mock('axios');

describe('Forecasting Controller - Integration Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = {
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should fetch cash flow prediction successfully with default 30 days', async () => {
        const mockData = { predictions: [100, 200, 300] };
        (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

        await getCashFlowPrediction(mockRequest as Request, mockResponse as Response);

        expect(axios.get).toHaveBeenCalledWith(expect.any(String), { params: { days: 30 } });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: true,
            data: mockData
        });
    });

    it('should use custom days parameter if provided', async () => {
        const mockData = { predictions: [100] };
        mockRequest.query = { days: '7' };
        (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

        await getCashFlowPrediction(mockRequest as Request, mockResponse as Response);

        expect(axios.get).toHaveBeenCalledWith(expect.any(String), { params: { days: '7' } });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 when AI core prediction fails', async () => {
        (axios.get as jest.Mock).mockRejectedValueOnce(new Error('AI Core offline'));

        await getCashFlowPrediction(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            message: "Failed to fetch forecasting data from AI Core",
            error: "AI Core offline"
        });
    });
});
