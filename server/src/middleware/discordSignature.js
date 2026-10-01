import { verifyKeyMiddleware } from "discord-interactions";

import { env } from "../config/env.js";

export const verifyDiscordSignature =
  verifyKeyMiddleware(env.discordPublicKey);