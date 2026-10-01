import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Settings() {
  const [configs, setConfigs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function loadConfig() {
    try {
      const data =
        await api.getConfig();

      setConfigs(data.configs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function updateConfig(
    config,
    field,
    value
  ) {
    const updated = {
      id: config.id,
      enabled: config.enabled,
      useAI: config.use_ai,
      mirrorEnabled:
        config.mirror_enabled,
    };

    updated[field] = value;

    try {
      const data =
        await api.updateConfig(
          updated
        );

      setConfigs((current) =>
        current.map((item) =>
          item.id === config.id
            ? data.config
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">
          Command Configuration
        </h1>

        <p className="text-slate-400 mt-2">
          Configure how Discord commands
          behave.
        </p>

        <div className="mt-8 space-y-5">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold">
                /{config.command_name}
              </h2>

              <div className="mt-5 space-y-4">
                <label className="flex items-center justify-between">
                  <span>
                    Command enabled
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      config.enabled
                    }
                    onChange={(e) =>
                      updateConfig(
                        config,
                        "enabled",
                        e.target.checked
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>
                    Gemini AI analysis
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      config.use_ai
                    }
                    onChange={(e) =>
                      updateConfig(
                        config,
                        "useAI",
                        e.target.checked
                      )
                    }
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>
                    Mirror notification
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      config.mirror_enabled
                    }
                    onChange={(e) =>
                      updateConfig(
                        config,
                        "mirrorEnabled",
                        e.target.checked
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}