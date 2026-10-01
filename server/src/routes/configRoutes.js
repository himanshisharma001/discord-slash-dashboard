import express from "express";

import {
  getConfig,
  updateConfig,
} from "../controllers/configController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getConfig);
router.put("/", updateConfig);

export default router;