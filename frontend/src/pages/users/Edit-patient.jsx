"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import PatientForm from "../../components/PatientForm"

export default function EditPatient() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authenticatedFetch, isLoggedIn } = useAuth()

  const patientId = location.state?.patient?.id
  if (!patientId) navigate("/home")

  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true)
        const res = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`)
        if (!res.ok) throw new Error("Failed to fetch patient details")
        const data = await res.json()
        setPatient(data)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPatientDetails()
  }, [authenticatedFetch, patientId])

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this patient?")) {
      try {
        setLoading(true)
        const res = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete patient")
        alert("Patient deleted successfully!")
        navigate("/patients")
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            className="border border-green-300 text-green-700 hover:bg-green-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            onClick={() => navigate(isLoggedIn ? "/home" : "/")}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          <button
            className="border border-red-300 text-red-700 hover:bg-red-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            onClick={handleDelete}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Delete Patient
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-800">Edit Patient Details</h1>
          <p className="text-green-600">Update patient demographics and blood metal details below</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
        )}

        {patient && <PatientForm patientId={patientId} initialData={patient} />}
      </div>
    </div>
  )
}
