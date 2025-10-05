"use client"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function PatientDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authenticatedFetch } = useAuth()

  const [patient, setPatient] = useState(null)
  const [bloodMetals, setBloodMetals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
      console.log(data)
      if (data.bloodMetals && data.bloodMetals.length > 0) {
        setBloodMetals(data.bloodMetals[0])
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = async () => {
    try {
      const res = await authenticatedFetch(`http://localhost:5000/reports/${id}`)
      console.log(res)
      if (!res.ok) throw new Error("Failed to download report")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report_${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert("Failed to download report")
      console.error(err)
    }
  }

  const handleEdit = () => {
    navigate("/edit-patient", { state: { patient } })
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
      <div className="p-6 text-center text-red-600">
        {error || "Patient not found"}
      </div>
    )
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6 text-black">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-green-200 p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-green-800">
                    Patient Details: {patient.name}
                </h1>
                <button
                    onClick={() => navigate("/home")}
                    className="text-green-600 hover:text-green-800"
                >
                    ← Back
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-green-700">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Age:</strong> {patient.ageYears}y {patient.ageMonths || 0}m</p>
                    <p><strong>Gender:</strong> {patient.gender}</p>
                    <p><strong>Height:</strong> {patient.heightCm ? `${patient.heightCm} cm` : "N/A"}</p>
                    <p><strong>Weight:</strong> {patient.weightKg ? `${patient.weightKg} kg` : "N/A"}</p>
                    <p><strong>BMI:</strong> {patient.bmi ? patient.bmi.toFixed(2) : "N/A"}</p>
                    <p><strong>Pregnancy:</strong> {patient.pregnancyStatus ? "Yes" : "No"}</p>
                    <p><strong>Diagnosis:</strong> {patient.diagnosis || "N/A"}</p>
                </div>
            </div>

            {bloodMetals && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-green-700">Blood Metal Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <p><strong>Lead:</strong> {bloodMetals.lead_umolL ?? "N/A"} µmol/L</p>
                        <p><strong>Mercury:</strong> {bloodMetals.mercury_umolL ?? "N/A"} µmol/L</p>
                        <p><strong>Cadmium:</strong> {bloodMetals.cadmium_umolL ?? "N/A"} µmol/L</p>
                        <p><strong>Selenium:</strong> {bloodMetals.selenium_umolL ?? "N/A"} µmol/L</p>
                        <p><strong>Manganese:</strong> {bloodMetals.manganese_umolL ?? "N/A"} µmol/L</p>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-4 border-t border-green-100 pt-6">
                <button
                    onClick={handleEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
                >
                    Edit
                </button>

                <button
                    onClick={handleViewReport}
                    disabled={!bloodMetals}
                    className={`${
                        bloodMetals
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-400 cursor-not-allowed"
                    } text-white font-medium py-2 px-6 rounded-md`}
                >
                    View Report
                </button>
            </div>
        </div>
    </div>
)
}
