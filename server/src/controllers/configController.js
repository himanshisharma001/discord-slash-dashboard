import pool from "../db/db.js";

export async function getConfig(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        cc.id,
        cc.server_id,
        cc.command_name,
        cc.enabled,
        cc.use_ai,
        cc.mirror_enabled
      FROM command_configs cc
      JOIN servers s
        ON s.id = cc.server_id
      WHERE s.user_id = $1
      ORDER BY cc.command_name
      `,
      [userId]
    );

    return res.json({
      configs: result.rows,
    });
  } catch (error) {
    console.error("Get config error:", error);

    return res.status(500).json({
      error: "Failed to load configuration",
    });
  }
}

export async function updateConfig(req, res) {
  try {
    const userId = req.user.id;

    const {
      id,
      enabled,
      useAI,
      mirrorEnabled,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE command_configs cc
      SET
        enabled = $1,
        use_ai = $2,
        mirror_enabled = $3,
        updated_at = CURRENT_TIMESTAMP
      FROM servers s
      WHERE cc.server_id = s.id
        AND cc.id = $4
        AND s.user_id = $5
      RETURNING cc.*
      `,
      [
        enabled,
        useAI,
        mirrorEnabled,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Configuration not found",
      });
    }

    return res.json({
      config: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update config error:",
      error
    );

    return res.status(500).json({
      error: "Failed to update configuration",
    });
  }
}