import { Router } from "express";
import { getCashFlowPrediction } from "../controllers/forecastingController.js";

const router = Router();

// GET /api/forecasting/predict
router.get("/predict", getCashFlowPrediction);

export default router;
