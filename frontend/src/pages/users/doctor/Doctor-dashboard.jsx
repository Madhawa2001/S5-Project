"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"
import { FiUsers, FiClipboard, FiActivity } from "react-icons/fi"

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()

  // Redirect if not logged in or not doctor
  if (!isLoggedIn || user?.role !== "doctor") {
    navigate("/login")
    return null
  }

  return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Doctor Dashboard</h1>
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/patients")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUsers className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">My Patients</h3>
                <p className="text-sm text-black">View assigned patients</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/add-patient")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiClipboard className="text-green-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Add Patient</h3>
                <p className="text-sm text-black">Register a new patient</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate("/predictions")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiActivity className="text-purple-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black">Predictions</h3>
                <p className="text-sm text-black">Run ML predictions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
