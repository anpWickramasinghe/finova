import { Request, Response } from "express";
import axios from "axios";

/**
 * Controller for forecasting functionalities.
 * Proxies requests to the AI Core Forecasting service.
 */
export const getCashFlowPrediction = async (req: Request, res: Response) => {
  try {
    const days = req.query.days || 30;
    
    // Call the AI core Python service
    // Defaulting to localhost:8001 as defined in server.py
    const AI_CORE_URL = process.env.AI_CORE_FORECASTING_URL || "http://localhost:8001";
    
    const response = await axios.get(`${AI_CORE_URL}/predict`, {
      params: { days }
    });

    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error("Error fetching cash flow prediction:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch forecasting data from AI Core",
      error: error.message
    });
  }
};
