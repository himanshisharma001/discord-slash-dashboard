import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="text-3xl font-bold text-white mt-2">
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
  });

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const [statsResponse, logsResponse] =
        await Promise.all([
          api.getStats(),
          api.getLogs(),
        ]);

      setStats(statsResponse.stats);
      setLogs(logsResponse.logs);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Command Desk
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Discord Bot Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
      
        <nav className="flex gap-2 mb-8">
          <Link
            to="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dashboard
          </Link>

          <Link
            to="/settings"
            className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Settings
          </Link>
        </nav>

        <main>
        
          <div className="grid md:grid-cols-3 gap-5">
            <StatCard
              title="Total Commands"
              value={stats.total}
            />

            <StatCard
              title="Successful"
              value={stats.successful}
            />

            <StatCard
              title="Failed"
              value={stats.failed}
            />
          </div>

          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Recent Commands
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Live command activity from Discord
                </p>
              </div>

              <span className="text-xs text-green-400">
                ● Live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                    <th className="px-5 py-4">
                      Command
                    </th>

                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      AI Tag
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-4 font-medium">
                        /{log.command_name}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {log.discord_username || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            log.status === "processed"
                              ? "text-green-400"
                              : log.status === "failed"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {log.ai_tag ? (
                          <span className="inline-flex rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300">
                            {log.ai_tag}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            -
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {log.action_taken || "-"}
                      </td>
                    </tr>
                  ))}

                  {logs.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No commands yet.
                        Run /status or /report
                        in Discord.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}