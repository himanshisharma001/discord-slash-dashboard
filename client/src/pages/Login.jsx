import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const LOGIN_EMAIL = "admin@example.com";
const LOGIN_PASSWORD = "admin@12345";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function useLoginCredentials() {
    setEmail(LOGIN_EMAIL);
    setPassword(LOGIN_PASSWORD);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await api.login(email.trim(), password);

      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Command Desk
            </h1>

            <p className="text-slate-400 mt-2">
              Discord Bot Dashboard
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-6">
            Admin Login
          </h2>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-950 p-5">
            <h3 className="font-semibold text-white mb-4">
              Login Credentials
            </h3>

            <div className="space-y-3 text-sm">

              <div>
                <p className="text-slate-500">
                  Email ID
                </p>

                <p className="text-slate-200 break-all mt-1">
                  {LOGIN_EMAIL}
                </p>
              </div>

              <div>
                <p className="text-slate-500">
                  Password
                </p>

                <p className="text-slate-200 mt-1">
                  {LOGIN_PASSWORD}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={useLoginCredentials}
              disabled={loading}
              className="mt-5 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              Use These Credentials
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}