"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

const API_BASE_URL = "http://localhost:5000"

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  const DUMMY_CREDENTIALS = {
    admin: {
      email: "admin@test.com",
      password: "admin123",
      userData: {
        id: 1,
        email: "admin@test.com",
        name: "Admin User",
        role: "admin",
      },
    },
    user: {
      email: "user@test.com",
      password: "user123",
      userData: {
        id: 2,
        email: "user@test.com",
        name: "Test User",
        role: "user",
        approved: true,
      },
    },
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      try {
        if (storedToken.startsWith("dummy_")) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          setIsLoggedIn(true)
        } else {
          const tokenPayload = JSON.parse(atob(storedToken.split(".")[1]))
          const currentTime = Date.now() / 1000

          if (tokenPayload.exp > currentTime) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
            setIsLoggedIn(true)
          } else {
            localStorage.removeItem("authToken")
            localStorage.removeItem("user")
          }
        }
      } catch (error) {
        console.error("Invalid token format:", error)
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, role = "user") => {
    try {
      // Try real backend API first
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()

        // Backend returns { accessToken, refreshToken, user }
        if (data.accessToken) {
          // Extract user info from JWT token
          const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]))

          // Determine role from token payload (backend includes roles array)
          const userRole = tokenPayload.roles?.some((r) => r.role?.name === "admin") ? "admin" : "user"

          const userData = {
            id: tokenPayload.userId,
            email: tokenPayload.email,
            name: tokenPayload.name || email,
            role: userRole,
          }

          setToken(data.accessToken)
          setUser(userData)
          setIsLoggedIn(true)
          localStorage.setItem("authToken", data.accessToken)
          localStorage.setItem("refreshToken", data.refreshToken)
          localStorage.setItem("user", JSON.stringify(userData))

          return { success: true, isDummy: false, user: userData }
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }
    } catch (error) {
      console.error("Backend login error:", error)

      // Fallback to dummy credentials if backend is not available
      const dummyCred = DUMMY_CREDENTIALS[role]
      if (dummyCred && email === dummyCred.email && password === dummyCred.password) {
        const dummyToken = `dummy_${role}_${Date.now()}`
        const dummyUser = dummyCred.userData

        setToken(dummyToken)
        setUser(dummyUser)
        setIsLoggedIn(true)
        localStorage.setItem("authToken", dummyToken)
        localStorage.setItem("user", JSON.stringify(dummyUser))
        return { success: true, isDummy: true, user: dummyUser }
      }

      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      // Try real backend API first
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: data.message || "Registration request submitted. Please wait for admin approval.",
          isDummy: false,
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }
    } catch (error) {
      console.error("Backend registration error:", error)

      // Fallback to dummy response if backend is not available
      if (token && token.startsWith("dummy_")) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return {
          success: true,
          message: "Registration request submitted. Please wait for admin approval.",
          isDummy: true,
        }
      }

      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
    setToken(null)
    setUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
  }

  const getAuthHeaders = () => {
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    }
    return {
      "Content-Type": "application/json",
    }
  }

  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }

    try {
      if (token && token.startsWith("dummy_")) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (url.includes("/api/patient/analyze")) {
          return {
            ok: true,
            json: async () => ({
              riskScore: Math.floor(Math.random() * 100),
              heavyMetals: {
                lead: Math.random() * 10,
                mercury: Math.random() * 5,
                cadmium: Math.random() * 3,
                arsenic: Math.random() * 8,
              },
              recommendations: [
                "Consider reducing exposure to environmental toxins",
                "Increase antioxidant-rich foods in diet",
                "Regular monitoring recommended",
              ],
            }),
          }
        }

        if (url.includes("/api/patients") && user?.role === "admin") {
          return {
            ok: true,
            json: async () => ({
              patients: [
                { id: 1, name: "John Doe", age: 35, status: "High Risk", lastVisit: "2024-01-15" },
                { id: 2, name: "Jane Smith", age: 28, status: "Low Risk", lastVisit: "2024-01-20" },
                { id: 3, name: "Bob Johnson", age: 42, status: "Medium Risk", lastVisit: "2024-01-18" },
              ],
            }),
          }
        }

        if (url.includes("/api/patients/assigned") && user?.role === "user") {
          return {
            ok: true,
            json: async () => ({
              patients: [{ id: 1, name: "John Doe", age: 35, status: "High Risk", lastVisit: "2024-01-15" }],
            }),
          }
        }

        if (url.includes("/api/requests") && user?.role === "admin") {
          return {
            ok: true,
            json: async () => ({
              requests: [
                {
                  id: 1,
                  name: "Alice Brown",
                  email: "alice@test.com",
                  requestDate: "2024-01-22",
                  status: "pending",
                },
                {
                  id: 2,
                  name: "Charlie Wilson",
                  email: "charlie@test.com",
                  requestDate: "2024-01-21",
                  status: "pending",
                },
              ],
            }),
          }
        }

        if (url.includes("/api/requests/") && options.method === "PUT") {
          return {
            ok: true,
            json: async () => ({ success: true, message: "Request processed successfully" }),
          }
        }

        return {
          ok: true,
          json: async () => ({ success: true, message: "Mock response" }),
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        logout()
        window.location.href = "/login"
        throw new Error("Session expired")
      }

      return response
    } catch (error) {
      console.error("API call error:", error)
      throw error
    }
  }

  const value = {
    isLoggedIn,
    user,
    token,
    login,
    logout,
    register,
    loading,
    getAuthHeaders,
    authenticatedFetch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
