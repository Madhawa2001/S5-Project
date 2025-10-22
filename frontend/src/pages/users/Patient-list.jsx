"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useEffect, useState } from "react"
import { FiSearch, FiEye, FiEdit } from "react-icons/fi"

export default function PatientList() {
  const navigate = useNavigate()
  const { logout, user, authenticatedFetch, isLoggedIn } = useAuth()
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }
    if (user?.role === "admin") {
      navigate("/admin/users")
      return
    }
    fetchPatients()
  }, [user, authenticatedFetch, navigate, isLoggedIn])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch("http://localhost:5000/patients")
      if (!response.ok) throw new Error("Failed to fetch patients")
      const data = await response.json()
      setPatients(data || [])
      setFilteredPatients(data || [])
    } catch (err) {
      console.error(err)
      setError("Failed to load patient data")
    } finally {
      setLoading(false)
    }
  }

  // Filter patients on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.nic?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [searchQuery, patients])

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

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, NIC, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-blue-200">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">NIC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Diagnosis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-blue-900">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-blue-700">{patient.nic || "N/A"}</td>
                  <td className="px-6 py-4 text-sm text-blue-700 capitalize">{patient.gender}</td>
                  <td className="px-6 py-4 text-sm text-blue-700">{patient.ageYears}y {patient.ageMonths || 0}m</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(patient.diagnosis)}`}>
                      {patient.diagnosis || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <FiEye /> View
                    </button>
                    <button
                      onClick={() => navigate("/edit-patient", { state: { patient } })}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <FiEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-blue-700">
                    No patients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
  )
}
