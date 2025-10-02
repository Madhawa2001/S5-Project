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
  const [age, setAge] = useState("")
  const [sex, setSex] = useState("")
  const [raceEthnicity, setRaceEthnicity] = useState("")
  const [educationLevel, setEducationLevel] = useState("")

  // Heavy metals state
  const [cadmium, setCadmium] = useState("")
  const [lead, setLead] = useState("")
  const [mercury, setMercury] = useState("")
  const [selenium, setSelenium] = useState("")

  // Biomarkers state
  const [cotinine, setCotinine] = useState("")
  const [bmi, setBmi] = useState("")

  const handleGenerateAssessment = async () => {
    // Collect all form data
    const patientData = {
      age,
      sex,
      raceEthnicity,
      educationLevel,
      cadmium,
      lead,
      mercury,
      selenium,
      cotinine,
      bmi,
    }

    // Basic validation for required fields
    if (!age || !sex || !cadmium || !lead || !mercury || !selenium) {
      alert("Please fill in all required fields (marked with *)")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await authenticatedFetch("/api/generate-report", {
        method: "POST",
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const reportData = await response.json()

      // Navigate to report page with both patient data and report data
      navigate("/report", {
        state: {
          patientData,
          reportData,
        },
      })
    } catch (error) {
      console.error("Error generating report:", error)
      setSubmitError(error.message || "Failed to generate report. Please try again.")

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

              <div className="grid w-full grid-cols-3 bg-green-50 border border-green-200 rounded-lg p-1">
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
                <button
                  onClick={() => setActiveTab("biomarkers")}
                  className={`py-2 px-4 rounded-md font-medium transition-colors ${
                    activeTab === "biomarkers"
                      ? "bg-white text-green-700 shadow-sm border border-green-300"
                      : "text-green-700 hover:bg-green-100"
                  }`}
                >
                  Biomarkers
                </button>
              </div>

              {/* Demographics Tab */}
              {activeTab === "demographics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="age" className="block text-sm font-medium text-green-700">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="age"
                        type="number"
                        placeholder="Enter age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sex" className="block text-sm font-medium text-green-700">
                        Sex <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="sex"
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      >
                        <option value="" className="text-gray-500">
                          Select sex
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
                      <label htmlFor="race-ethnicity" className="block text-sm font-medium text-green-700">
                        Race/Ethnicity
                      </label>
                      <select
                        id="race-ethnicity"
                        value={raceEthnicity}
                        onChange={(e) => setRaceEthnicity(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      >
                        <option value="" className="text-gray-500">
                          Select race/ethnicity
                        </option>
                        <option value="white" className="text-gray-900">
                          White
                        </option>
                        <option value="black" className="text-gray-900">
                          Black or African American
                        </option>
                        <option value="hispanic" className="text-gray-900">
                          Hispanic or Latino
                        </option>
                        <option value="asian" className="text-gray-900">
                          Asian
                        </option>
                        <option value="native-american" className="text-gray-900">
                          American Indian or Alaska Native
                        </option>
                        <option value="pacific-islander" className="text-gray-900">
                          Native Hawaiian or Pacific Islander
                        </option>
                        <option value="mixed" className="text-gray-900">
                          Mixed Race
                        </option>
                        <option value="other" className="text-gray-900">
                          Other
                        </option>
                        <option value="prefer-not-to-say" className="text-gray-900">
                          Prefer not to say
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="education-level" className="block text-sm font-medium text-green-700">
                        Education Level
                      </label>
                      <select
                        id="education-level"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      >
                        <option value="" className="text-gray-500">
                          Select education level
                        </option>
                        <option value="less-than-high-school" className="text-gray-900">
                          Less than High School
                        </option>
                        <option value="high-school" className="text-gray-900">
                          High School Graduate
                        </option>
                        <option value="some-college" className="text-gray-900">
                          Some College
                        </option>
                        <option value="associates" className="text-gray-900">
                          Associate's Degree
                        </option>
                        <option value="bachelors" className="text-gray-900">
                          Bachelor's Degree
                        </option>
                        <option value="masters" className="text-gray-900">
                          Master's Degree
                        </option>
                        <option value="doctorate" className="text-gray-900">
                          Doctorate
                        </option>
                      </select>
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
                    <h3 className="text-lg font-semibold text-green-800">Blood Heavy Metal Concentrations (μg/dL)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="cadmium" className="block text-sm font-medium text-green-700">
                        Cadmium (μg/dL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="cadmium"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 0.45"
                        value={cadmium}
                        onChange={(e) => setCadmium(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lead" className="block text-sm font-medium text-green-700">
                        Lead (μg/dL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="lead"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 1.2"
                        value={lead}
                        onChange={(e) => setLead(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="mercury" className="block text-sm font-medium text-green-700">
                        Mercury (μg/dL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="mercury"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 0.8"
                        value={mercury}
                        onChange={(e) => setMercury(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="selenium" className="block text-sm font-medium text-green-700">
                        Selenium (μg/dL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="selenium"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 19.5"
                        value={selenium}
                        onChange={(e) => setSelenium(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Biomarkers Tab */}
              {activeTab === "biomarkers" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="cotinine" className="block text-sm font-medium text-green-700">
                        Cotinine (ng/mL)
                      </label>
                      <input
                        id="cotinine"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 0.3 (smoking indicator)"
                        value={cotinine}
                        onChange={(e) => setCotinine(e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                      <p className="text-sm text-green-600">Smoking indicator biomarker</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bmi" className="block text-sm font-medium text-green-700">
                        BMI (kg/m²)
                      </label>
                      <input
                        id="bmi"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 24.5"
                        value={bmi}
                        onChange={(e) => setBmi(e.target.value)}
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
                    Generating Report...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Generate Risk Assessment
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
