import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { verifyDiscordSignature } from "./middleware/discordSignature.js";
import {
  handleDiscordInteraction,
} from "./controllers/discordController.js";

import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import configRoutes from "./routes/configRoutes.js";

const app = express();

// --------------------------------------------------
// General middleware
// --------------------------------------------------

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

app.use(cookieParser());


app.post(
  "/api/discord/interactions",
  express.raw({
    type: "application/json",
  }),
  verifyDiscordSignature,
  handleDiscordInteraction
);

// --------------------------------------------------
// Normal JSON routes
// --------------------------------------------------

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/config", configRoutes);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    environment: env.nodeEnv,
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: "Internal server error",
  });
});

export default app;