"use client"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function BloodMetalData() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authenticatedFetch } = useAuth()
  const { patientId, name } = location.state || {}

  const [lead, setLead] = useState("")
  const [mercury, setMercury] = useState("")
  const [cadmium, setCadmium] = useState("")
  const [selenium, setSelenium] = useState("")
  const [manganese, setManganese] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [selectedModel, setSelectedModel] = useState("")

  const handleSubmit = async () => {
    // 🔹 Step 1 commented (no patient ID validation)
    if (!patientId) {
      alert("No patient selected. Please go back and add a patient first.")
      navigate("/patientdata")
      return
    }

    if (!lead && !mercury && !cadmium && !selenium && !manganese) {
      alert("Please enter at least one blood metal value.")
      return
    }
    const bloodMetalsData = {
      lead_umolL: lead ? parseFloat(lead) : null,
      mercury_umolL: mercury ? parseFloat(mercury) : null,
      cadmium_umolL: cadmium ? parseFloat(cadmium) : null,
      selenium_umolL: selenium ? parseFloat(selenium) : null,
      manganese_umolL: manganese ? parseFloat(manganese) : null,
    }

    const res = await authenticatedFetch(`http://localhost:5000/bloodMetals/${patientId}`, {
      method: "POST",
      body: JSON.stringify(bloodMetalsData),
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Failed to save blood metals")
    }
    // Instead of submitting immediately, ask which prediction they want
    setShowModelSelect(true)
  }

  const handlePredict = async () => {
    if (!selectedModel) {
      alert("Please select a model to predict.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const bloodMetalsData = {
        features: {
          id: patientId,
          lead_umolL: lead ? Number.parseFloat(lead) : null,
          mercury_umolL: mercury ? Number.parseFloat(mercury) : null,
          cadmium_umolL: cadmium ? Number.parseFloat(cadmium) : null,
          selenium_umolL: selenium ? Number.parseFloat(selenium) : null,
          manganese_umolL: manganese ? Number.parseFloat(manganese) : null,
        },
      }

      // 🔹 Send the request to your backend ML API
      const res = await authenticatedFetch(`http://localhost:5000/ml/${selectedModel}/api`, {
        method: "POST",
        body: JSON.stringify(bloodMetalsData),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Prediction failed")
      }

      const data = await res.json()
      alert(`Prediction completed: ${JSON.stringify(data)}`)
      navigate("/home")
    } catch (err) {
      console.error(err)
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
      setShowModelSelect(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="border border-green-300 text-green-700 hover:bg-green-50 bg-transparent font-medium py-2 px-4 rounded-md transition-colors flex items-center"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-800">
            Blood Metal Details for {name ? name : "Patient"}
          </h1>
          <p className="text-green-600">Enter blood metal concentrations to trigger ML predictions.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["Lead (µmol/L)", lead, setLead],
              ["Mercury (µmol/L)", mercury, setMercury],
              ["Cadmium (µmol/L)", cadmium, setCadmium],
              ["Selenium (µmol/L)", selenium, setSelenium],
              ["Manganese (µmol/L)", manganese, setManganese],
            ].map(([label, val, setVal]) => (
              <div key={label}>
                <label className="block text-sm font-medium text-green-700">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-green-100">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-8 rounded-md transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Predict & Save"}
            </button>
          </div>

          {showModelSelect && (
            <div className="mt-6 border-t border-green-100 pt-6">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Which prediction do you want to run?</h2>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border border-green-300 rounded-md text-black"
              >
                <option value="">Select model</option>
                <option value="hormone">Hormone</option>
                <option value="infertility">Infertility</option>
                <option value="menstrual">Menstrual</option>
                <option value="menopause">Menopause</option>
              </select>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handlePredict}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
                >
                  {isSubmitting ? "Predicting..." : "Run Prediction"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
