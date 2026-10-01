import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      env.jwtSecret
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}