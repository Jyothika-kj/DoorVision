import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-surface-container-low p-10 lg:flex">
          <div>
            <h1 className="text-5xl font-bold text-primary">DoorVision AI</h1>
            <p className="mt-3 font-mono text-sm uppercase tracking-widest text-on-surface-variant">
              Facility Command
            </p>
          </div>

          <div className="max-w-xl">
            <h2 className="text-4xl font-bold leading-tight text-on-background">
              AI-powered CCTV entry and exit counting system.
            </h2>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              Monitor room occupancy using camera feed, head detection,
              tracking IDs, and entry/exit line crossing analytics.
            </p>
          </div>

          <p className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
            Secure admin console
          </p>
        </section>

        <section className="flex items-center justify-center px-4 py-10">
          <form
            onSubmit={handleSubmit}
            className="glass-panel w-full max-w-md rounded-xl p-6 md:p-8"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary lg:hidden">
                DoorVision AI
              </h1>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                Admin Login
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="admin@doorvision.ai"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              {error && (
                <div className="rounded border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                <span className="material-symbols-outlined text-sm">login</span>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Login;