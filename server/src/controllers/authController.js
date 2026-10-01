import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import pool from "../db/db.js";
import { env } from "../config/env.js";

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite:
      env.nodeEnv === "production"
        ? "none"
        : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error:
          "Password must contain at least 8 characters",
      });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING id, email
      `,
      [
        email.toLowerCase(),
        passwordHash,
      ]
    );

    const user = result.rows[0];

    const token = createToken(user);

    setAuthCookie(res, token);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      error: "Registration failed",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      `,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = createToken(user);

    setAuthCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  }
}

export function logout(req, res) {
  res.clearCookie("auth_token");

  return res.json({
    success: true,
  });
}

export async function me(req, res) {
  return res.json({
    user: req.user,
  });
}