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
  return fetch(
    `${discordApi}/webhooks/${applicationId}/${interactionToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
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