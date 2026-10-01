const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(
  path,
  {
    method = "GET",
    body,
  } = {}
) {
  const response = await fetch(
    `${API_BASE_URL}/api${path}`,
    {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Something went wrong"
    );
  }

  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: {
        email,
        password,
      },
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  me: () =>
    request("/auth/me"),

  getStats: () =>
    request("/dashboard/stats"),

  getLogs: () =>
    request("/dashboard/logs"),

  getConfig: () =>
    request("/config"),

  updateConfig: (config) =>
    request("/config", {
      method: "PUT",
      body: config,
    }),
};