"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useEffect, useState } from "react"

export default function Home() {
  const navigate = useNavigate()
  const { logout, user, authenticatedFetch, isLoggedIn } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    const fetchPatients = async () => {
      try {
        setLoading(true)
        const endpoint = user?.role === "admin" ? "/api/patients" : "/api/patients/assigned"
        const response = await authenticatedFetch(endpoint)

        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        } else {
          throw new Error("Failed to fetch patients")
        }
      } catch (err) {
        console.error("Error fetching patients:", err)
        setError("Failed to load patient data")
        if (isLoggedIn) {
          navigate("/home")
        } else {
          navigate("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [user, authenticatedFetch, navigate, isLoggedIn])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "high risk":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium risk":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low risk":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800">
                {user?.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
              </h1>
              <p className="text-sm text-green-600">
                Welcome back, {user?.name || "User"}
                {user?.role === "admin" && " (Administrator)"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/requests")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Requests
                </button>
              )}
              <button
                onClick={() => navigate("/patient-data")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                New Patient
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md border border-green-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-green-800">
              {user?.role === "admin" ? "All Patients" : "Assigned Patients"}
            </h2>
            <span className="text-sm text-green-600">{patients.length} patients</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">{error}</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-green-900">No patients found</h3>
              <p className="mt-1 text-sm text-green-500">
                {user?.role === "admin"
                  ? "No patients in the system yet."
                  : "No patients have been assigned to you yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-green-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-700">{patient.age}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            patient.status,
                          )}`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{patient.lastVisit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                        <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
