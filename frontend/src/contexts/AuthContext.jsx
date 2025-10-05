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
    doctor: {
      email: "doctor@test.com",
      password: "doctor123",
      userData: {
        id: 2,
        email: "doctor@test.com",
        name: "Test Doctor",
        role: "doctor",
        approved: true,
      },
    },
  }

  // Initialize authentication state from localStorage on app load
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

  /**
   * Login function - Authenticates user with backend API
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @param {string} role - User's role (admin or doctor)
   * @returns {Object} - { success: boolean, isDummy: boolean, user: Object, error: string }
   */
  const login = async (email, password, role) => {
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
          // Decode token
          const tokenPayload = JSON.parse(atob(data.accessToken.split(".")[1]))

          // Extract the first role from backend roles array
          const rolesArray = Array.isArray(tokenPayload.roles) ? tokenPayload.roles : []
          const userRole = rolesArray.length > 0 ? rolesArray[0] : "doctor"

          console.log("Decoded JWT payload:", tokenPayload)
          console.log("Extracted user role:", userRole)

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

          console.log("User data stored in localStorage:", userData)
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

  /**
   * Register function - Creates new user account (requires admin approval)
   * @param {Object} userData - { email, password, name }
   * @returns {Object} - { success: boolean, message: string, isDummy: boolean, error: string }
   */
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
          role: userData.role,
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

  /**
   * Logout function - Clears authentication state and local storage
   */
  const logout = () => {
    setIsLoggedIn(false)
    setToken(null)
    setUser(null)
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
  }

  /**
   * Get authentication headers for API requests
   * @returns {Object} - Headers object with Authorization and Content-Type
   */
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

  /**
   * Authenticated fetch wrapper - Makes API calls with authentication headers
   * Falls back to dummy data if using dummy credentials
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Response>} - Fetch response
   */
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }

    try {
      if (token && token.startsWith("dummy_")) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock response for patient analysis
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

        // Mock response for fetching all patients (admin or doctor)
        if (url.includes("/patients") && !url.includes("/patients/")) {
          return {
            ok: true,
            json: async () => [
              {
                id: "1",
                name: "John Doe",
                ageYears: 35,
                ageMonths: 6,
                gender: "male",
                diagnosis: "High Risk",
                createdAt: "2024-01-15",
              },
              {
                id: "2",
                name: "Jane Smith",
                ageYears: 28,
                ageMonths: 3,
                gender: "female",
                diagnosis: "Low Risk",
                createdAt: "2024-01-20",
              },
            ],
          }
        }

        // Mock response for pending user approvals (admin only)
        if (url.includes("/admin/pending") && user?.role === "admin") {
          return {
            ok: true,
            json: async () => [
              {
                id: "1",
                name: "Alice Brown",
                email: "alice@test.com",
                createdAt: new Date("2024-01-22").toISOString(),
              },
              {
                id: "2",
                name: "Charlie Wilson",
                email: "charlie@test.com",
                createdAt: new Date("2024-01-21").toISOString(),
              },
            ],
          }
        }

        // Mock response for approving a user
        if (url.includes("/admin/approve/") && options.method === "POST") {
          return {
            ok: true,
            json: async () => ({ message: "User approved", user: { id: "1", email: "test@test.com" } }),
          }
        }

        // Mock response for assigning role to user
        if (url.includes("/admin/assign-role") && options.method === "POST") {
          return {
            ok: true,
            json: async () => ({ message: "Role assigned successfully" }),
          }
        }

        return {
          ok: true,
          json: async () => ({ success: true, message: "Mock response" }),
        }
      }

      // Make real API call to backend
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle unauthorized access (expired token)
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
