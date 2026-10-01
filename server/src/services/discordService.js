import { env } from "../config/env.js";

const discordApi = "https://discord.com/api/v10";

async function discordRequest(path, options = {}) {
  const url = `${discordApi}${path}`;

  console.log("Discord URL:", url);
  console.log("Discord method:", options.method || "GET");
  console.log(
    "Discord token loaded:",
    Boolean(env.discordBotToken)
  );

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bot ${env.discordBotToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    console.log(
      "Discord response status:",
      response.status
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Discord API error ${response.status}: ${text}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Discord fetch error:", error);
    console.error("Discord fetch cause:", error.cause);

    throw error;
  }
}

export async function registerCommands() {
  const commands = [
    {
      name: "report",
      description: "Submit a report",
      options: [
        {
          name: "text",
          description: "Describe the issue",
          type: 3,
          required: true,
        },
      ],
    },
    {
      name: "status",
      description: "Show bot status",
    },
  ];

  return discordRequest(
    `/applications/${env.discordApplicationId}/commands`,
    {
      method: "PUT",
      body: JSON.stringify(commands),
    }
  );
}

export async function sendFollowUp(
  applicationId,
  interactionToken,
  payload
) {
  const url =
    `${discordApi}/webhooks/${applicationId}/${interactionToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log(
    "Discord follow-up response status:",
    response.status
  );

  if (response.ok) {
    return {
      success: true,
      response,
    };
  }

  const text = await response.text();

  console.error(
    "Discord follow-up failed:",
    response.status
  );

  console.error(
    "Discord follow-up response body:",
    text.slice(0, 1000)
  );

  if (response.status === 429) {
    console.error(
      "Discord/Cloudflare rate limit detected. Not retrying automatically."
    );

    return {
      success: false,
      rateLimited: true,
      status: 429,
      error: "Discord API rate limited the follow-up request.",
    };
  }

  throw new Error(
    `Discord follow-up error ${response.status}: ${text}`
  );
}

export async function sendChannelMessage(channelId, content) {
  return discordRequest(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
    }),
  });
}