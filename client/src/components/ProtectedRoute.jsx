import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ProtectedRoute({
  children,
}) {
  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        await api.me();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Checking authentication...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}