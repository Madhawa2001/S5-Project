"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMail, FiLock } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor"); // 'doctor' | 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(email, password, role);
      if (result.success) {
        if (role === "admin") navigate("/admin");
        else if (role === "nurse") navigate("/nurse");
        else navigate("/patients");
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Medical System</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Role Selector */}
        <div className="flex mb-6 rounded-md overflow-hidden border border-blue-200">
          <button
            type="button"
            onClick={() => setRole("doctor")}
            className={`flex-1 py-2 font-medium text-sm transition-colors ${
              role === "doctor" || role === "nurse"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 font-medium text-sm transition-colors ${
              role === "admin"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={email}
                required
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                value={password}
                required
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-200"></div>
          </div>
          <div className="relative flex justify-center text-sm text-blue-600 bg-white px-2">
            Or continue with
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-blue-300 text-blue-700 font-medium py-2 px-4 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        {/* Register & Forgot password */}
        {(role === "doctor" || role === "nurse") && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don’t have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        )}

        <div className="text-center mt-4">
          <a
            href="#"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
