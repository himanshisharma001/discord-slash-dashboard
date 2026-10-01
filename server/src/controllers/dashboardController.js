import pool from "../db/db.js";

export async function getStats(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        COUNT(cl.id)::int AS total,
        COUNT(*) FILTER (
          WHERE cl.status = 'processed'
        )::int AS successful,
        COUNT(*) FILTER (
          WHERE cl.status = 'failed'
        )::int AS failed
      FROM command_logs cl
      JOIN servers s
        ON s.id = cl.server_id
      WHERE s.user_id = $1
      `,
      [userId]
    );

    return res.json({
      stats: result.rows[0],
    });
  } catch (error) {
    console.error("Stats error:", error);

    return res.status(500).json({
      error: "Failed to load statistics",
    });
  }
}

export async function getLogs(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        cl.id,
        cl.interaction_id,
        cl.command_name,
        cl.command_text,
        cl.discord_username,
        cl.status,
        cl.action_taken,
        cl.ai_summary,
        cl.ai_tag,
        cl.error_message,
        cl.created_at,
        cl.processed_at
      FROM command_logs cl
      JOIN servers s
        ON s.id = cl.server_id
      WHERE s.user_id = $1
      ORDER BY cl.created_at DESC
      LIMIT 100
      `,
      [userId]
    );

    return res.json({
      logs: result.rows,
    });
  } catch (error) {
    console.error("Logs error:", error);

    return res.status(500).json({
      error: "Failed to load logs",
    });
  }
}