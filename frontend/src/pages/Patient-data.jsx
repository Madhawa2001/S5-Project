"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function PatientData() {
  const navigate = useNavigate()
  const { isLoggedIn, authenticatedFetch, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const [name, setName] = useState("")
  const [dob, setDob] = useState("")
  const [ageYears, setAgeYears] = useState("")
  const [ageMonths, setAgeMonths] = useState("")
  const [gender, setGender] = useState("")
  const [pregnancyCount, setPregnancyCount] = useState("")
  const [pregnancyStatus, setPregnancyStatus] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")

  // Doctor selection for nurse
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")

  // Calculate age from DOB
  const handleDobChange = (value) => {
    setDob(value)
    if (value) {
      const birthDate = new Date(value)
      const today = new Date()
      let years = today.getFullYear() - birthDate.getFullYear()
      let months = today.getMonth() - birthDate.getMonth()
      if (months < 0) {
        years -= 1
        months += 12
      }
      setAgeYears(years)
      setAgeMonths(months)
    } else {
      setAgeYears("")
      setAgeMonths("")
    }
  }

  // Fetch doctors list if user is a nurse
  useEffect(() => {
    const fetchDoctors = async () => {
      if (user?.role === "nurse") {
        try {
          const res = await authenticatedFetch("http://localhost:5000/doctors")
          if (!res.ok) throw new Error("Failed to fetch doctors")
          const data = await res.json()
          setDoctors(data)
        } catch (err) {
          console.error(err)
        }
      }
    }
    fetchDoctors()
  }, [authenticatedFetch, user])

  const handleCreatePatient = async (redirectToBloodMetals = false) => {
    if (!name || !dob || !gender) {
      alert("Please fill in all required fields (Name, DOB, Gender)")
      return
    }

    if (user.role === "nurse" && !selectedDoctorId) {
      alert("Please select a doctor")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const patientData = {
        name,
        ageYears: Number.parseInt(ageYears),
        ageMonths: Number.parseInt(ageMonths),
        gender,
        pregnancyCount: gender === "female" && pregnancyCount ? Number.parseInt(pregnancyCount) : null,
        pregnancyStatus: gender === "female" ? pregnancyStatus : false,
        diagnosis: diagnosis || null,
        doctorId: user.role === "nurse" ? selectedDoctorId : undefined, // Send doctorId if nurse
      }

      const response = await authenticatedFetch("http://localhost:5000/patients", {
        method: "POST",
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create patient")
      }

      const createdPatient = await response.json()

      if (redirectToBloodMetals) {
        navigate("/blood-metals", { state: { patientId: createdPatient.id, name: createdPatient.name } })
      } else {
        navigate("/home")
      }
    } catch (error) {
      console.error("Error creating patient:", error)
      setSubmitError(error.message || "Failed to create patient. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            className="border border-green-300 text-green-700 hover:bg-green-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
            onClick={() => navigate(isLoggedIn ? "/home" : "/")}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isLoggedIn ? "Back to Home" : "Back to Login"}
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-800">Patient Data Entry</h1>
          <p className="text-green-600">Enter patient demographics to add a new record or continue to add blood metal details</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-green-200">
          <div className="border-b border-green-100 p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-green-800">New Patient Details</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-700">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="Enter patient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">Age (Years)</label>
                <input
                  type="number"
                  value={ageYears}
                  readOnly
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">Age (Months)</label>
                <input
                  type="number"
                  value={ageMonths}
                  readOnly
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">Pregnancy Count</label>
                <input
                  type="number"
                  value={pregnancyCount}
                  onChange={(e) => setPregnancyCount(e.target.value)}
                  disabled={gender === "male"}
                  className={`w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black ${
                    gender === "male" ? "bg-gray-100" : ""
                  }`}
                  placeholder="Number of pregnancies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700">Currently Pregnant</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={pregnancyStatus === true}
                      onChange={() => setPregnancyStatus(true)}
                      disabled={gender === "male"}
                      className="text-green-600"
                    />
                    <span className={`text-black ${gender === "male" ? "text-gray-400" : ""}`}>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={pregnancyStatus === false}
                      onChange={() => setPregnancyStatus(false)}
                      disabled={gender === "male"}
                      className="text-green-600"
                    />
                    <span className={`text-black ${gender === "male" ? "text-gray-400" : ""}`}>No</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-700">Diagnosis / Notes</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="Enter diagnosis or clinical notes"
                />
              </div>

              {/* Doctor selection dropdown for nurse */}
              {user.role === "nurse" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-green-700">Assign Doctor <span className="text-red-500">*</span></label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end pt-6 border-t border-green-100 gap-4">
              <button
                onClick={() => handleCreatePatient(false)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Add Patient
              </button>

              <button
                onClick={() => handleCreatePatient(true)}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
