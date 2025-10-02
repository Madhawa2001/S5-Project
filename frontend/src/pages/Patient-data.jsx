"use client"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function PatientData() {
  const [activeTab, setActiveTab] = useState("demographics")
  const navigate = useNavigate()
  const { isLoggedIn, authenticatedFetch } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Demographics state
  const [name, setName] = useState("")
  const [ageYears, setAgeYears] = useState("")
  const [ageMonths, setAgeMonths] = useState("")
  const [gender, setGender] = useState("")
  const [pregnancyCount, setPregnancyCount] = useState("")
  const [pregnancyStatus, setPregnancyStatus] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")

  // Heavy metals state (in µmol/L as per backend)
  const [lead, setLead] = useState("")
  const [mercury, setMercury] = useState("")
  const [cadmium, setCadmium] = useState("")
  const [selenium, setSelenium] = useState("")
  const [manganese, setManganese] = useState("")

  /**
   * Handle patient creation and blood metals submission
   * Flow:
   * 1. POST /patients - Create patient record
   * 2. POST /bloodMetals/:patientId - Add blood metals data
   * 3. Backend automatically triggers ML predictions
   * 4. Navigate to home page to view the new patient
   */
  const handleGenerateAssessment = async () => {
    // Basic validation for required fields
    if (!name || !ageYears || !gender) {
      alert("Please fill in all required fields (Name, Age, Gender)")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Step 1: Create patient record
      const patientData = {
        name,
        ageYears: Number.parseInt(ageYears),
        ageMonths: ageMonths ? Number.parseInt(ageMonths) : 0,
        gender,
        pregnancyCount: pregnancyCount ? Number.parseInt(pregnancyCount) : null,
        pregnancyStatus,
        diagnosis: diagnosis || null,
      }

      const patientResponse = await authenticatedFetch("http://localhost:5000/patients", {
        method: "POST",
        body: JSON.stringify(patientData),
      })

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json()
        throw new Error(errorData.error || "Failed to create patient")
      }

      const createdPatient = await patientResponse.json()

      // Step 2: Add blood metals data if provided
      if (lead || mercury || cadmium || selenium || manganese) {
        const bloodMetalsData = {
          lead_umolL: lead ? Number.parseFloat(lead) : null,
          mercury_umolL: mercury ? Number.parseFloat(mercury) : null,
          cadmium_umolL: cadmium ? Number.parseFloat(cadmium) : null,
          selenium_umolL: selenium ? Number.parseFloat(selenium) : null,
          manganese_umolL: manganese ? Number.parseFloat(manganese) : null,
        }

        const bloodMetalsResponse = await authenticatedFetch(`http://localhost:5000/bloodMetals/${createdPatient.id}`, {
          method: "POST",
          body: JSON.stringify(bloodMetalsData),
        })

        if (!bloodMetalsResponse.ok) {
          const errorData = await bloodMetalsResponse.json()
          console.error("Failed to add blood metals:", errorData)
          // Don't throw error, patient is already created
        }
      }

      // Navigate back to home page to view the new patient
      navigate("/home")
    } catch (error) {
      console.error("Error creating patient:", error)
      setSubmitError(error.message || "Failed to create patient. Please try again.")

      if (!isLoggedIn) {
        navigate("/")
      }
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
          <p className="text-green-600">
            Enter patient demographics and blood heavy metal concentrations for risk assessment
          </p>
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
              <h2 className="text-xl font-semibold text-green-800">New Patient Assessment</h2>
            </div>
            <p className="text-green-600 mt-1">Complete all required fields for accurate risk prediction</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {submitError}
                </div>
              )}

              <div className="grid w-full grid-cols-2 bg-green-50 border border-green-200 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("demographics")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    activeTab === "demographics"
                      ? "bg-white text-green-700 shadow-sm border border-green-300"
                      : "text-green-700 hover:bg-green-100"
                  }`}
                >
                  Demographics
                </button>
                <button
                  onClick={() => setActiveTab("heavy-metals")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    activeTab === "heavy-metals"
                      ? "bg-white text-green-700 shadow-sm border border-green-300"
                      : "text-green-700 hover:bg-green-100"
                  }`}
                >
                  Heavy Metals
                </button>
              </div>

              {/* Demographics Tab */}
              {activeTab === "demographics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-green-700">
                        Patient Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Enter patient name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ageYears" className="block text-sm font-medium text-green-700">
                        Age (Years) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ageYears"
                        type="number"
                        placeholder="Enter age in years"
                        value={ageYears}
                        onChange={(e) => setAgeYears(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ageMonths" className="block text-sm font-medium text-green-700">
                        Age (Months)
                      </label>
                      <input
                        id="ageMonths"
                        type="number"
                        placeholder="0-11 months"
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(e.target.value)}
                        min="0"
                        max="11"
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gender" className="block text-sm font-medium text-green-700">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      >
                        <option value="" className="text-gray-500">
                          Select gender
                        </option>
                        <option value="male" className="text-gray-900">
                          Male
                        </option>
                        <option value="female" className="text-gray-900">
                          Female
                        </option>
                        <option value="other" className="text-gray-900">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pregnancyCount" className="block text-sm font-medium text-green-700">
                        Pregnancy Count
                      </label>
                      <input
                        id="pregnancyCount"
                        type="number"
                        placeholder="Number of pregnancies"
                        value={pregnancyCount}
                        onChange={(e) => setPregnancyCount(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pregnancyStatus" className="block text-sm font-medium text-green-700">
                        Currently Pregnant
                      </label>
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pregnancyStatus"
                            checked={pregnancyStatus === true}
                            onChange={() => setPregnancyStatus(true)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-900">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="pregnancyStatus"
                            checked={pregnancyStatus === false}
                            onChange={() => setPregnancyStatus(false)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-900">No</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="diagnosis" className="block text-sm font-medium text-green-700">
                        Diagnosis / Notes
                      </label>
                      <textarea
                        id="diagnosis"
                        placeholder="Enter diagnosis or clinical notes"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Heavy Metals Tab */}
              {activeTab === "heavy-metals" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-800">Blood Heavy Metal Concentrations (µmol/L)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="lead" className="block text-sm font-medium text-green-700">
                        Lead (µmol/L)
                      </label>
                      <input
                        id="lead"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 0.45"
                        value={lead}
                        onChange={(e) => setLead(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="mercury" className="block text-sm font-medium text-green-700">
                        Mercury (µmol/L)
                      </label>
                      <input
                        id="mercury"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 0.8"
                        value={mercury}
                        onChange={(e) => setMercury(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="cadmium" className="block text-sm font-medium text-green-700">
                        Cadmium (µmol/L)
                      </label>
                      <input
                        id="cadmium"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 1.2"
                        value={cadmium}
                        onChange={(e) => setCadmium(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="selenium" className="block text-sm font-medium text-green-700">
                        Selenium (µmol/L)
                      </label>
                      <input
                        id="selenium"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 19.5"
                        value={selenium}
                        onChange={(e) => setSelenium(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="manganese" className="block text-sm font-medium text-green-700">
                        Manganese (µmol/L)
                      </label>
                      <input
                        id="manganese"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 8.3"
                        value={manganese}
                        onChange={(e) => setManganese(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Assessment Button */}
            <div className="flex justify-end pt-6 border-t border-green-100">
              <button
                onClick={handleGenerateAssessment}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-8 rounded-md transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Patient...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
