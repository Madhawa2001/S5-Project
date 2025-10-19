"use client"
import { useEffect, useState } from "react"
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

  useEffect(() => {
    fetchPatientDetails()
  }, [id])

  const fetchPatientDetails = async () => {
    try {
      setLoading(true)
      const res = await authenticatedFetch(`http://localhost:5000/patients/${id}`)
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
        lead_umolL: bloodMetalForm.lead_umolL ? Number.parseFloat(bloodMetalForm.lead_umolL) : null,
        mercury_umolL: bloodMetalForm.mercury_umolL ? Number.parseFloat(bloodMetalForm.mercury_umolL) : null,
        cadmium_umolL: bloodMetalForm.cadmium_umolL ? Number.parseFloat(bloodMetalForm.cadmium_umolL) : null,
        selenium_umolL: bloodMetalForm.selenium_umolL ? Number.parseFloat(bloodMetalForm.selenium_umolL) : null,
        manganese_umolL: bloodMetalForm.manganese_umolL ? Number.parseFloat(bloodMetalForm.manganese_umolL) : null,
      }

      Object.keys(payload).forEach((key) => {
        if (isNaN(payload[key])) {
          payload[key] = null
        }
      })

      const res = await authenticatedFetch(`http://localhost:5000/bloodmetals/${id}`, {
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
    if (!confirm("Are you sure you want to delete this patient?")) return

    try {
      const res = await authenticatedFetch(`http://localhost:5000/patients/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete patient")
      navigate("/home")
    } catch (err) {
      alert(err.message || "Failed to delete patient")
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div>
        </div>
    )
  }

  if (error || !patient) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error || "Patient not found"}</div>
      </Layout>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-6xl mx-auto" style={{ color: "#000" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black">Patient Details</h1>
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-black">NIC</p>
              <p className="font-medium">{patient.nic || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Gender</p>
              <p className="font-medium">{patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-black">Age</p>
              <p className="font-medium">
                {patient.ageYears || 0} years {patient.ageMonths || 0} months
              </p>
            </div>
            <div>
              <p className="text-sm text-black">Date of Birth</p>
              <p className="font-medium">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Doctor</p>
              <p className="font-medium">{patient.doctor?.name || "Unassigned"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">Physical Measurements</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-black">Height</p>
              <p className="font-medium">{patient.heightCm ? `${patient.heightCm} cm` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Weight</p>
              <p className="font-medium">{patient.weightKg ? `${patient.weightKg} kg` : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">BMI</p>
              <p className="font-medium">{patient.bmi ? patient.bmi.toFixed(2) : "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Phone</p>
              <p className="font-medium">{patient.contactNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-black">Email</p>
              <p className="font-medium">{patient.email || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-black">Address</p>
              <p className="font-medium">{patient.address || "N/A"}</p>
            </div>
          </div>
        </div>

        {patient.gender === "Female" && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-black mb-4">Reproductive Health</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-black">Pregnancies</p>
                <p className="font-medium">{patient.pregnancyCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-black">Currently Pregnant</p>
                <p className="font-medium">{patient.pregnancyStatus ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-black">Used Female Hormones</p>
                <p className="font-medium">{patient.everUsedFemaleHormones ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black">Blood Metals History</h2>
            <button
              onClick={() => setShowAddBloodMetals(!showAddBloodMetals)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FiPlus />
              Add Blood Metals
            </button>
          </div>

          {showAddBloodMetals && (
            <form onSubmit={handleAddBloodMetals} className="mb-6 bg-green-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Lead (µmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bloodMetalForm.lead_umolL}
                    onChange={(e) =>
                      setBloodMetalForm({
                        ...bloodMetalForm,
                        lead_umolL: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Mercury (µmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bloodMetalForm.mercury_umolL}
                    onChange={(e) =>
                      setBloodMetalForm({
                        ...bloodMetalForm,
                        mercury_umolL: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Cadmium (µmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bloodMetalForm.cadmium_umolL}
                    onChange={(e) =>
                      setBloodMetalForm({
                        ...bloodMetalForm,
                        cadmium_umolL: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Selenium (µmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bloodMetalForm.selenium_umolL}
                    onChange={(e) =>
                      setBloodMetalForm({
                        ...bloodMetalForm,
                        selenium_umolL: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Manganese (µmol/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bloodMetalForm.manganese_umolL}
                    onChange={(e) =>
                      setBloodMetalForm({
                        ...bloodMetalForm,
                        manganese_umolL: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBloodMetals(false)}
                  className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Lead</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Mercury</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Cadmium</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Selenium</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-black uppercase">Manganese</th>
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
    </div>
  )
}
