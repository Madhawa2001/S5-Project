"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import PatientData from "./pages/Patient-data"
import Report from "./pages/Report"
import Requests from "./pages/Requests"
import { useAuth } from "./contexts/AuthContext"

function App() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Default route goes to login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/patient-data" element={<PatientData />} />
        <Route path="/report" element={<Report />} />
        <Route path="/requests" element={<Requests />} />

        <Route path="*" element={<Navigate to={isLoggedIn ? "/home" : "/"} />} />
      </Routes>
    </Router>
  )
}

export default App
