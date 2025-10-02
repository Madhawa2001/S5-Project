"use client"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function Report() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const patientData = location.state?.patientData
    const backendReportData = location.state?.reportData

    if (!patientData) {
      navigate(isLoggedIn ? "/home" : "/")
      return
    }

    if (backendReportData) {
      setReportData(backendReportData)
      setLoading(false)
      return
    }

    const generateMockReport = async () => {
      try {
        setLoading(true)

        // Mock report data for demonstration (when backend is not connected)
        const mockReport = {
          patientId: `PAT-${Date.now()}`,
          assessmentDate: new Date().toLocaleDateString(),
          riskScore: Math.floor(Math.random() * 100),
          riskLevel: ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)],
          recommendations: [
            "Regular monitoring of heavy metal levels recommended",
            "Consider dietary modifications to reduce exposure",
            "Follow up with healthcare provider in 3 months",
          ],
          detailedAnalysis: {
            heavyMetals: {
              cadmium: { level: patientData.cadmium, status: "Normal", reference: "< 1.0 μg/dL" },
              lead: { level: patientData.lead, status: "Elevated", reference: "< 5.0 μg/dL" },
              mercury: { level: patientData.mercury, status: "Normal", reference: "< 10.0 μg/dL" },
              selenium: { level: patientData.selenium, status: "Normal", reference: "15-25 μg/dL" },
            },
            demographics: {
              age: patientData.age,
              sex: patientData.sex,
              raceEthnicity: patientData.raceEthnicity,
              educationLevel: patientData.educationLevel,
            },
            biomarkers: {
              cotinine: patientData.cotinine || "Not provided",
              bmi: patientData.bmi || "Not provided",
            },
          },
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000))

        setReportData(mockReport)
      } catch (error) {
        console.error("Error generating report:", error)
        navigate(isLoggedIn ? "/home" : "/")
      } finally {
        setLoading(false)
      }
    }

    generateMockReport()
  }, [location.state, navigate, isLoggedIn])

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      case "moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "normal":
        return "text-green-600"
      case "elevated":
        return "text-red-600"
      case "high":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Generating Report</h2>
            <p className="text-green-600">Analyzing patient data and calculating risk assessment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg className="h-12 w-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Generating Report</h2>
            <p className="text-red-600 mb-4">Unable to generate the risk assessment report.</p>
            <button
              onClick={() => navigate(isLoggedIn ? "/home" : "/")}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoggedIn ? "Back to Home" : "Back to Login"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
          <button
            onClick={() => window.print()}
            className="border border-green-300 text-green-700 hover:bg-green-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Report
          </button>
        </div>

        {/* Report Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-800">Risk Assessment Report</h1>
          <p className="text-green-600">
            Patient ID: {reportData.patientId} | Generated: {reportData.assessmentDate}
          </p>
        </div>

        {/* Risk Score Summary */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-800">Overall Risk Assessment</h2>
            <div className={`px-4 py-2 rounded-full border font-medium ${getRiskLevelColor(reportData.riskLevel)}`}>
              {reportData.riskLevel} Risk
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-green-800 mb-2">{reportData.riskScore}/100</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${reportData.riskScore}%` }}
                ></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Key Recommendations</h3>
              <ul className="space-y-1">
                {reportData.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="text-sm text-green-600 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Heavy Metals Analysis */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Heavy Metals Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.detailedAnalysis.heavyMetals).map(([metal, data]) => (
              <div key={metal} className="border border-green-100 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 capitalize mb-2">{metal}</h3>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">{data.level} μg/dL</div>
                  <div className={`text-sm font-medium ${getStatusColor(data.status)}`}>{data.status}</div>
                  <div className="text-xs text-gray-500">Reference: {data.reference}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Patient Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-green-600 font-medium">Age</div>
              <div className="text-lg text-gray-900">{reportData.detailedAnalysis.demographics.age} years</div>
            </div>
            <div>
              <div className="text-sm text-green-600 font-medium">Sex</div>
              <div className="text-lg text-gray-900 capitalize">{reportData.detailedAnalysis.demographics.sex}</div>
            </div>
            <div>
              <div className="text-sm text-green-600 font-medium">Race/Ethnicity</div>
              <div className="text-lg text-gray-900 capitalize">
                {reportData.detailedAnalysis.demographics.raceEthnicity || "Not specified"}
              </div>
            </div>
            <div>
              <div className="text-sm text-green-600 font-medium">Education</div>
              <div className="text-lg text-gray-900 capitalize">
                {reportData.detailedAnalysis.demographics.educationLevel || "Not specified"}
              </div>
            </div>
          </div>
        </div>

        {/* Biomarkers */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Biomarkers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Cotinine</h3>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.detailedAnalysis.biomarkers.cotinine}
                {reportData.detailedAnalysis.biomarkers.cotinine !== "Not provided" && " ng/mL"}
              </div>
              <div className="text-xs text-gray-500">Smoking indicator</div>
            </div>
            <div className="border border-green-100 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">BMI</h3>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.detailedAnalysis.biomarkers.bmi}
                {reportData.detailedAnalysis.biomarkers.bmi !== "Not provided" && " kg/m²"}
              </div>
              <div className="text-xs text-gray-500">Body Mass Index</div>
            </div>
          </div>
        </div>

        {/* Full Recommendations */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Detailed Recommendations</h2>
          <ul className="space-y-3">
            {reportData.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
