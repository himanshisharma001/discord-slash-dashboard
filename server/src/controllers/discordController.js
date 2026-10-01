import { InteractionType, InteractionResponseType } from "discord-interactions";

import pool from "../db/db.js";
import { env } from "../config/env.js";

import {
  sendFollowUp,
  sendChannelMessage,
} from "../services/discordService.js";

import { analyzeReport } from "../services/geminiService.js";

// ==================================================
// Main Discord Interaction Handler
// ==================================================

export async function handleDiscordInteraction(req, res) {
  const interaction = req.body;

  console.log("=================================");
  console.log("Discord interaction received");
  console.log("Interaction type:", interaction?.type);
  console.log("Interaction ID:", interaction?.id);
  console.log("Command:", interaction?.data?.name);
  console.log("=================================");

  // --------------------------------------------------
  // Safety check
  // --------------------------------------------------

  if (!interaction) {
    console.error("Discord interaction body is missing.");

    return res.status(400).json({
      error: "Missing interaction body",
    });
  }

  // --------------------------------------------------
  // Discord PING
  // --------------------------------------------------

  if (interaction.type === InteractionType.PING) {
    console.log("Discord PING received.");

    return res.json({
      type: InteractionResponseType.PONG,
    });
  }

  // --------------------------------------------------
  // Only process slash commands
  // --------------------------------------------------

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    console.log("Unsupported interaction type:", interaction.type);

    return res.status(400).json({
      error: "Unsupported interaction type",
    });
  }

  const interactionId = interaction.id;
  const commandName = interaction.data?.name;

  console.log("Processing command:", commandName);

  // --------------------------------------------------
  // Discord information
  // --------------------------------------------------

  const guildId = interaction.guild_id || null;
  const channelId = interaction.channel_id || null;

  const userId = interaction.member?.user?.id || interaction.user?.id || null;

  const username =
    interaction.member?.user?.username ||
    interaction.user?.username ||
    "Unknown User";

  // --------------------------------------------------
  // Get command text
  // --------------------------------------------------

  let commandText = "";

  if (commandName === "report") {
    const textOption = interaction.data?.options?.find(
      (option) => option.name === "text",
    );

    commandText = textOption?.value || "";
  }

  if (commandName === "status") {
    console.log("Sending /status response immediately...");

    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Bot is online and working correctly.",
      },
    });

    // ------------------------------------------------
    // Database work happens AFTER Discord response
    // ------------------------------------------------

    processStatus({
      interaction,
      interactionId,
      guildId,
      channelId,
      userId,
      username,
    }).catch((error) => {
      console.error("Status background processing failed:", error);
    });

    return;
  }

  // ==================================================
  // /report
  // ==================================================
  //
  // Send a deferred response immediately.
  // ==================================================

  if (commandName === "report") {
    console.log("Sending /report deferred response immediately...");

    res.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });

    // ------------------------------------------------
    // Slow report processing happens afterwards
    // ------------------------------------------------

    processReport(interaction, {
      interactionId,
      guildId,
      channelId,
      userId,
      username,
      commandText,
    }).catch((error) => {
      console.error("Report background processing failed:", error);
    });

    return;
  }

  // ==================================================
  // Unknown command
  // ==================================================

  console.log("Unknown Discord command:", commandName);

  return res.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: "Unknown command.",
    },
  });
}

// ==================================================
// Create / Find Server
// ==================================================

async function getOrCreateServer({ guildId, guildName, channelId }) {
  if (!guildId) {
    return null;
  }

  const serverResult = await pool.query(
    `
    INSERT INTO servers (
      user_id,
      discord_guild_id,
      discord_guild_name,
      primary_channel_id
    )
    VALUES (
      (SELECT id FROM users ORDER BY id LIMIT 1),
      $1,
      $2,
      $3
    )
    ON CONFLICT (user_id, discord_guild_id)
    DO UPDATE SET
      primary_channel_id = EXCLUDED.primary_channel_id,
      discord_guild_name = EXCLUDED.discord_guild_name
    RETURNING id
    `,
    [guildId, guildName || "Discord Server", channelId],
  );

  const serverId = serverResult.rows[0]?.id || null;

  if (!serverId) {
    return null;
  }

  // --------------------------------------------------
  // Create default command configurations
  // --------------------------------------------------

  await pool.query(
    `
    INSERT INTO command_configs (
      server_id,
      command_name,
      enabled,
      use_ai,
      mirror_enabled
    )
    VALUES
      ($1, 'report', TRUE, TRUE, TRUE),
      ($1, 'status', TRUE, FALSE, TRUE)
    ON CONFLICT (
      server_id,
      command_name
    )
    DO NOTHING
    `,
    [serverId],
  );

  return serverId;
}

// ==================================================
// Save command interaction
// ==================================================

async function saveCommandLog({
  interactionId,
  serverId,
  guildId,
  channelId,
  userId,
  username,
  commandName,
  commandText,
}) {
  try {
    await pool.query(
      `
      INSERT INTO command_logs (
        interaction_id,
        server_id,
        discord_guild_id,
        discord_channel_id,
        discord_user_id,
        discord_username,
        command_name,
        command_text,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      `,
      [
        interactionId,
        serverId,
        guildId,
        channelId,
        userId,
        username,
        commandName,
        commandText,
        "received",
      ],
    );

    return true;
  } catch (error) {
    if (error.code === "23505") {
      console.log("Duplicate Discord interaction:", interactionId);

      return false;
    }

    throw error;
  }
}

// ==================================================
// Process /status
// ==================================================

async function processStatus({
  interaction,
  interactionId,
  guildId,
  channelId,
  userId,
  username,
}) {
  try {
    console.log("Starting background /status processing...");

    // ------------------------------------------------
    // Find/create server
    // ------------------------------------------------

    const serverId = await getOrCreateServer({
      guildId,
      guildName: interaction.guild?.name || "Discord Server",
      channelId,
    });

    // ------------------------------------------------
    // Save interaction
    // ------------------------------------------------

    const saved = await saveCommandLog({
      interactionId,
      serverId,
      guildId,
      channelId,
      userId,
      username,
      commandName: "status",
      commandText: "",
    });

    // Duplicate request
    if (!saved) {
      return;
    }

    // ------------------------------------------------
    // Check status configuration
    // ------------------------------------------------

    if (serverId) {
      const configResult = await pool.query(
        `
        SELECT enabled
        FROM command_configs
        WHERE server_id = $1
          AND command_name = 'status'
        LIMIT 1
        `,
        [serverId],
      );

      if (configResult.rows.length > 0 && !configResult.rows[0].enabled) {
        await pool.query(
          `
          UPDATE command_logs
          SET
            status = $1,
            action_taken = $2,
            processed_at = CURRENT_TIMESTAMP
          WHERE interaction_id = $3
          `,
          ["failed", "Status command is disabled", interactionId],
        );

        console.log("/status is disabled.");

        return;
      }
    }

    // ------------------------------------------------
    // Mark processed
    // ------------------------------------------------

    await pool.query(
      `
      UPDATE command_logs
      SET
        status = $1,
        action_taken = $2,
        processed_at = CURRENT_TIMESTAMP
      WHERE interaction_id = $3
      `,
      ["processed", "Status command processed", interactionId],
    );

    console.log("/status background processing completed.");
  } catch (error) {
    console.error("/status processing error:", error);

    try {
      await pool.query(
        `
        UPDATE command_logs
        SET
          status = $1,
          error_message = $2,
          processed_at = CURRENT_TIMESTAMP
        WHERE interaction_id = $3
        `,
        ["failed", error.message, interactionId],
      );
    } catch (dbError) {
      console.error("Failed to update /status error log:", dbError);
    }
  }
}

// ==================================================
// Process /report
// ==================================================

async function processReport(
  interaction,
  { interactionId, guildId, channelId, userId, username, commandText },
) {
  let serverId = null;
  let aiResult = null;

  try {
    console.log("Starting background /report processing...");

    // ------------------------------------------------
    // Find/create server
    // ------------------------------------------------

    serverId = await getOrCreateServer({
      guildId,
      guildName: interaction.guild?.name || "Discord Server",
      channelId,
    });

    // ------------------------------------------------
    // Save interaction
    // ------------------------------------------------

    const saved = await saveCommandLog({
      interactionId,
      serverId,
      guildId,
      channelId,
      userId,
      username,
      commandName: "report",
      commandText,
    });

    // ------------------------------------------------
    // Duplicate interaction
    // ------------------------------------------------

    if (!saved) {
      console.log("Skipping duplicate /report interaction.");

      return;
    }

    // ------------------------------------------------
    // Configuration defaults
    // ------------------------------------------------

    let enabled = true;
    let useAI = true;
    let mirrorEnabled = true;

    // ------------------------------------------------
    // Read command configuration
    // ------------------------------------------------

    if (serverId) {
      const configResult = await pool.query(
        `
        SELECT
          enabled,
          use_ai,
          mirror_enabled
        FROM command_configs
        WHERE server_id = $1
          AND command_name = 'report'
        LIMIT 1
        `,
        [serverId],
      );

      if (configResult.rows.length > 0) {
        enabled = configResult.rows[0].enabled;

        useAI = configResult.rows[0].use_ai;

        mirrorEnabled = configResult.rows[0].mirror_enabled;
      }
    }

    // ------------------------------------------------
    // Check whether /report is enabled
    // ------------------------------------------------

    if (!enabled) {
      await pool.query(
        `
        UPDATE command_logs
        SET
          status = $1,
          action_taken = $2,
          processed_at = CURRENT_TIMESTAMP
        WHERE interaction_id = $3
        `,
        ["failed", "Report command is disabled", interactionId],
      );

      const followUpResult = await sendFollowUp(
        env.discordApplicationId,
        interaction.token,
        {
          content: responseText,
        },
      );

      if (followUpResult?.success) {
        console.log("Report follow-up sent successfully.");
      } else {
        console.error(
          "Report was processed, but Discord follow-up could not be delivered.",
        );

        await pool.query(
          `
    UPDATE command_logs
    SET
      action_taken = $1,
      error_message = $2
    WHERE interaction_id = $3
    `,
          [
            "Report processed, but Discord response delivery failed",
            followUpResult?.error || "Discord follow-up failed",
            interactionId,
          ],
        );
      }

      return;
    }

    // ------------------------------------------------
    // Gemini AI analysis
    // ------------------------------------------------

    if (useAI && commandText) {
      try {
        console.log("Sending report to Gemini...");

        aiResult = await analyzeReport(commandText);

        console.log("Gemini analysis completed.");
      } catch (error) {
        console.error("Gemini failed:", error);

        aiResult = {
          summary: "AI analysis unavailable.",
          tag: "other",
        };
      }
    }

    // ------------------------------------------------
    // Prepare result
    // ------------------------------------------------

    const summary =
      aiResult?.summary || commandText || "No report text provided.";

    const tag = aiResult?.tag || "other";

    // ------------------------------------------------
    // Update database
    // ------------------------------------------------

    await pool.query(
      `
      UPDATE command_logs
      SET
        status = $1,
        action_taken = $2,
        ai_summary = $3,
        ai_tag = $4,
        processed_at = CURRENT_TIMESTAMP
      WHERE interaction_id = $5
      `,
      [
        "processed",
        "Report analyzed and processed",
        summary,
        tag,
        interactionId,
      ],
    );

    // ------------------------------------------------
    // Discord follow-up
    // ------------------------------------------------

    const responseText =
      `**Report received**\n\n` +
      `**Summary:** ${summary}\n` +
      `**Category:** ${tag}`;

    await sendFollowUp(env.discordApplicationId, interaction.token, {
      content: responseText,
    });

    console.log("Report follow-up sent successfully.");

    // ------------------------------------------------
    // Mirror notification
    // ------------------------------------------------

    if (mirrorEnabled && serverId) {
      const serverResult = await pool.query(
        `
          SELECT mirror_channel_id
          FROM servers
          WHERE id = $1
          LIMIT 1
          `,
        [serverId],
      );

      const mirrorChannel = serverResult.rows[0]?.mirror_channel_id;

      if (mirrorChannel) {
        const mirrorText =
          `**New Discord Report**\n\n` +
          `**User:** ${username}\n` +
          `**Summary:** ${summary}\n` +
          `**Category:** ${tag}`;

        try {
          await sendChannelMessage(mirrorChannel, mirrorText);

          console.log("Mirror notification sent successfully.");
        } catch (error) {
          console.error("Mirror notification failed:", error);

          await pool.query(
            `
            UPDATE command_logs
            SET
              action_taken = $1,
              error_message = $2
            WHERE interaction_id = $3
            `,
            [
              "Report processed, but mirror notification failed",
              error.message,
              interactionId,
            ],
          );
        }
      }
    }

    console.log("/report background processing completed.");
  } catch (error) {
    console.error("processReport error:", error);

    // ------------------------------------------------
    // Mark report as failed
    // ------------------------------------------------

    try {
      await pool.query(
        `
        UPDATE command_logs
        SET
          status = $1,
          error_message = $2,
          processed_at = CURRENT_TIMESTAMP
        WHERE interaction_id = $3
        `,
        ["failed", error.message, interactionId],
      );
    } catch (dbError) {
      console.error("Failed to update report error log:", dbError);
    }

    // ------------------------------------------------
    // Send error follow-up
    // ------------------------------------------------

    try {
      await sendFollowUp(env.discordApplicationId, interaction.token, {
        content: "Something went wrong while processing your report.",
      });
    } catch (followUpError) {
      console.error("Failed to send error follow-up:", followUpError);
    }
  }
}
