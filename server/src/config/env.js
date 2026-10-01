import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "DATABASE_URL",
  "DISCORD_APPLICATION_ID",
  "DISCORD_PUBLIC_KEY",
  "DISCORD_BOT_TOKEN",
  "GEMINI_API_KEY",
  "JWT_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  databaseUrl: process.env.DATABASE_URL,

  discordApplicationId: process.env.DISCORD_APPLICATION_ID,
  discordPublicKey: process.env.DISCORD_PUBLIC_KEY,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,

  geminiApiKey: process.env.GEMINI_API_KEY,

  jwtSecret: process.env.JWT_SECRET,

  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
};