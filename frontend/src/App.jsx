"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import Home from "./pages/users/Home"
import AddPatient from "./pages/users/Add-patient"
import PatientDetails from "./pages/users/Patient-details"
import EditPatient from "./pages/users/Edit-patient"
import Report from "./pages/users/doctor/Report"
import Requests from "./pages/admin/Requests"
import Predictions from "./pages/users/doctor/Predictions"
import AdminUsers from "./pages/admin/Admin-users"
import AccessLogs from "./pages/admin/Access-logs"
import { useAuth } from "./contexts/AuthContext"
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  const { isLoggedIn, loading, user } = useAuth()

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
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with layout */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-patient"
          element={
            <ProtectedRoute>
              <Layout>
                <AddPatient />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-patient"
          element={
            <ProtectedRoute>
              <Layout>
                <EditPatient />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Layout>
                <Report />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <Requests />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <Layout>
                <Predictions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions/:id"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <Layout>
                <Predictions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <AdminUsers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <AccessLogs />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={
            isLoggedIn ? (
              user?.role === "admin" ? (
                <Navigate to="/admin/users" />
              ) : (
                <Navigate to="/home" />
              )
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
