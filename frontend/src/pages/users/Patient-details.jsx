import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import Layout from "../../components/Layout"
import { FiEdit, FiTrash2, FiPlus, FiFileText } from "react-icons/fi"

export default function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authenticatedFetch, user } = useAuth()

  const [patient, setPatient] = useState(null)
  const [bloodMetals, setBloodMetals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddBloodMetals, setShowAddBloodMetals] = useState(false)
  const [bloodMetalForm, setBloodMetalForm] = useState({
    lead_umolL: "",
    mercury_umolL: "",
    cadmium_umolL: "",
    selenium_umolL: "",
    manganese_umolL: "",
  })
  const VITE_API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPatientDetails()
  }, [id])

  const fetchPatientDetails = async () => {
    try {
      setLoading(true)
      const res = await authenticatedFetch(`${VITE_API_URL}/patients/${id}`)
      if (!res.ok) throw new Error("Failed to fetch patient details")
      const data = await res.json()
      setPatient(data)
      if (data.bloodMetals && Array.isArray(data.bloodMetals)) {
        setBloodMetals(data.bloodMetals)
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBloodMetals = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        lead_umolL: bloodMetalForm.lead_umolL ? parseFloat(bloodMetalForm.lead_umolL) : null,
        mercury_umolL: bloodMetalForm.mercury_umolL ? parseFloat(bloodMetalForm.mercury_umolL) : null,
        cadmium_umolL: bloodMetalForm.cadmium_umolL ? parseFloat(bloodMetalForm.cadmium_umolL) : null,
        selenium_umolL: bloodMetalForm.selenium_umolL ? parseFloat(bloodMetalForm.selenium_umolL) : null,
        manganese_umolL: bloodMetalForm.manganese_umolL ? parseFloat(bloodMetalForm.manganese_umolL) : null,
      }

      Object.keys(payload).forEach((key) => {
        if (isNaN(payload[key])) payload[key] = null
      })

      const res = await authenticatedFetch(`${VITE_API_URL}/bloodmetals/${id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to add blood metals")

      setShowAddBloodMetals(false)
      setBloodMetalForm({
        lead_umolL: "",
        mercury_umolL: "",
        cadmium_umolL: "",
        selenium_umolL: "",
        manganese_umolL: "",
      })
      fetchPatientDetails()
    } catch (err) {
      alert(err.message || "Failed to add blood metals")
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return
    try {
      const res = await authenticatedFetch(`${VITE_API_URL}/patients/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete patient")

      navigate(user.role === "nurse" ? "/nurse/patients" : "/doctor/patients")
    } catch (err) {
      alert(err.message || "Failed to delete patient")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || "Patient not found"}
        </div>
      </Layout>
    )
  }

  return (
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Patient Details</h1>
          <div className="flex gap-2">
            <Link
              to={`/predictions/${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiFileText />
              View Predictions
            </Link>
            <Link
              to={`/edit-patient`}
              state={{ patient }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiEdit />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <FiTrash2 />
              Delete
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Name</p>
              <p className="font-medium text-black">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-black">NIC</p>
              <p className="font-medium text-black">{patient.nic || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Gender</p>
              <p className="font-medium text-black">{patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-black">Age</p>
              <p className="font-medium text-black">{patient.ageYears || 0} years {patient.ageMonths || 0} months</p>
            </div>
            <div>
              <p className="text-sm text-black">Date of Birth</p>
              <p className="font-medium text-black">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Doctor</p>
              <p className="font-medium text-black">{patient.doctor?.name || "Unassigned"}</p>
            </div>
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Physical Measurements</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-black">Height</p>
              <p className="font-medium text-black">{patient.heightCm ? `${patient.heightCm} cm` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Weight</p>
              <p className="font-medium text-black">{patient.weightKg ? `${patient.weightKg} kg` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">BMI</p>
              <p className="font-medium text-black">{patient.bmi ? patient.bmi.toFixed(2) : "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Phone</p>
              <p className="font-medium text-black">{patient.contactNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Email</p>
              <p className="font-medium text-black">{patient.email || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-black">Address</p>
              <p className="font-medium text-black">{patient.address || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Female Reproductive Health */}
        {patient.gender === "Female" && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reproductive Health</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-black">Pregnancies</p>
                <p className="font-medium text-black">{patient.pregnancyCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-black">Currently Pregnant</p>
                <p className="font-medium text-black">{patient.pregnancyStatus ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-black">Used Female Hormones</p>
                <p className="font-medium text-black">{patient.everUsedFemaleHormones ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Blood Metals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Blood Metals History</h2>
            <button
              onClick={() => setShowAddBloodMetals(!showAddBloodMetals)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiPlus />
              Add Blood Metals
            </button>
          </div>

          {showAddBloodMetals && (
            <form onSubmit={handleAddBloodMetals} className="mb-6 bg-blue-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                {["lead", "mercury", "cadmium", "selenium", "manganese"].map((metal) => (
                  <div key={metal}>
                    <label className="block text-sm font-medium text-black mb-1">
                      {metal.charAt(0).toUpperCase() + metal.slice(1)} (µmol/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bloodMetalForm[`${metal}_umolL`]}
                      onChange={(e) =>
                        setBloodMetalForm({
                          ...bloodMetalForm,
                          [`${metal}_umolL`]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBloodMetals(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {bloodMetals.length === 0 ? (
            <p className="text-black text-center py-4">No blood metals data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Lead", "Mercury", "Cadmium", "Selenium", "Manganese"].map((header) => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bloodMetals.map((bm) => (
                    <tr key={bm.id}>
                      <td className="px-4 py-2 text-sm text-black">{new Date(bm.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm text-black">{bm.lead_umolL || "N/A"}</td>
                      <td className="px-4 py-2 text-sm text-black">{bm.mercury_umolL || "N/A"}</td>
                      <td className="px-4 py-2 text-sm text-black">{bm.cadmium_umolL || "N/A"}</td>
                      <td className="px-4 py-2 text-sm text-black">{bm.selenium_umolL || "N/A"}</td>
                      <td className="px-4 py-2 text-sm text-black">{bm.manganese_umolL || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  )
}
