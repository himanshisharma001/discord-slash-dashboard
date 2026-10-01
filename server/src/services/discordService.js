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
    return response;
  }

  const text = await response.text();

  if (response.status === 429) {
    let retryAfterSeconds = 2;

    try {
      const data = JSON.parse(text);

      if (typeof data.retry_after === "number") {
        retryAfterSeconds = data.retry_after;
      }
    } catch {
      const headerValue =
        response.headers.get("Retry-After");

      const parsedHeader =
        Number(headerValue);

      if (Number.isFinite(parsedHeader)) {
        retryAfterSeconds = parsedHeader;
      }
    }

    // Never keep a Discord interaction waiting for hours.
    const waitSeconds = Math.min(
      Math.max(retryAfterSeconds, 1),
      5
    );

    console.log(
      `Discord rate limited follow-up. Waiting ${waitSeconds} seconds before one retry.`
    );

    await new Promise((resolve) =>
      setTimeout(resolve, waitSeconds * 1000)
    );

    const retryResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(
      "Discord follow-up retry response status:",
      retryResponse.status
    );

    if (retryResponse.ok) {
      return retryResponse;
    }

    const retryText =
      await retryResponse.text();

    throw new Error(
      `Discord follow-up retry failed ${retryResponse.status}: ${retryText}`
    );
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