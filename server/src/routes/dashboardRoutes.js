import express from "express";

import {
  getStats,
  getLogs,
} from "../controllers/dashboardController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/stats", getStats);
router.get("/logs", getLogs);

export default router;