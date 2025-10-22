"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import PatientForm from "../../components/PatientForm"

export default function AddPatient() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  // Redirect if not logged in
  if (!isLoggedIn) navigate("/login")

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <button
            className="border border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            onClick={() => navigate(-1)}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-blue-800">Add New Patient</h1>
          <p className="text-blue-600">Enter patient demographics and optional blood metal details below</p>
        </div>

        {/* Patient Form */}
        <PatientForm />
      </div>
  )
}
