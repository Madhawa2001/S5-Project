"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import PatientList from "./pages/users/Patient-list"
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
import DoctorDashboard from "./pages/users/doctor/Doctor-dashboard"
import NurseDashboard from "./pages/users/nurse/Nurse-dashboard"
import AdminDashboard from "./pages/admin/Admin-dashboard"

function App() {
  const { isLoggedIn, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Helper: default dashboard based on role
  const getDefaultDashboard = () => {
    if (!user) return "/login"
    switch (user.role) {
      case "admin":
        return "/admin/dashboard"
      case "doctor":
        return "/doctor/dashboard"
      case "nurse":
        return "/nurse/dashboard"
      default:
        return "/login"
    }
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isLoggedIn ? <Navigate to={getDefaultDashboard()} /> : <Login />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to={getDefaultDashboard()} /> : <Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with layout */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientList />
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
            <ProtectedRoute allowedRoles={["doctor"]}>
              <Layout>
                <Report />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
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
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={"doctor"}>
              <Layout>
                <DoctorDashboard/>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse/dashboard"
          element={
            <ProtectedRoute allowedRoles={"nurse"}>
              <Layout>
                <NurseDashboard/>
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={getDefaultDashboard()} />} />
      </Routes>
    </Router>
  )
}

export default App
