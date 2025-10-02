"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("user") // 'admin' or 'user'
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await login(email, password, role)

      if (result.success) {
        navigate("/home")
      } else {
        setError(result.error || "Login failed. Please try again.")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-green-200 p-6">
        <div className="space-y-1 text-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Reproductive Health Risk Predictor</h1>
          <p className="text-green-600">Sign in to access the clinical decision support system</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-1 bg-green-50 rounded-lg">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                role === "user"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-transparent text-green-700 hover:bg-green-100"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                role === "admin"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-transparent text-green-700 hover:bg-green-100"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-green-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-green-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                required
                disabled={loading}
              />
            </div>

            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              <p className="font-medium mb-1">Test Credentials:</p>
              <p>Admin: admin@test.com / admin123</p>
              <p>User: user@test.com / user123</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {role === "user" && (
            <div className="text-center">
              <p className="text-sm text-green-600 mb-2">Don't have an account?</p>
              <button
                onClick={() => navigate("/register")}
                className="w-full border border-green-600 text-green-700 hover:bg-green-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors"
              >
                Register as New User
              </button>
            </div>
          )}

          <div className="text-center">
            <a href="#" className="text-sm text-green-600 hover:text-green-800 hover:underline">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
