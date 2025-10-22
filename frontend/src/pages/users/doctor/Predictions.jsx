"use client"
import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { FiDownload } from "react-icons/fi"

const PALETTE = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // teal
]

export default function Predictions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authenticatedFetch, user } = useAuth()

  const [patient, setPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedModel, setSelectedModel] = useState("hormone")
  const [predictionResult, setPredictionResult] = useState(null)
  const [sensitivityResult, setSensitivityResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fetchingPatient, setFetchingPatient] = useState(true)
  const VITE_API_URL = import.meta.env.VITE_API_URL

  const availableModels = [
    { id: "hormone", label: "Hormone Model" },
    { id: "infertility", label: "Infertility Model" },
    { id: "menstrual", label: "Menstrual Model" },
    { id: "menopause", label: "Menopause Model" },
  ]

  useEffect(() => {
    if (id) fetchPatientData()
    else fetchAllPatients()
  }, [])

  const fetchPatientData = async () => {
    try {
      setFetchingPatient(true)
      const res = await authenticatedFetch(` ${VITE_API_URL}/patients/${id}`)
      if (!res.ok) throw new Error("Failed to fetch patient data")
      const data = await res.json()
      setPatient(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setFetchingPatient(false)
    }
  }

  const fetchAllPatients = async () => {
    try {
      setFetchingPatient(true)
      const res = await authenticatedFetch(`${VITE_API_URL}/patients`)
      if (!res.ok) throw new Error("Failed to fetch patients list")
      const data = await res.json()
      setPatients(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setFetchingPatient(false)
    }
  }

  const runPrediction = async () => {
    if (!patient) {
      setError("Please select a patient")
      return
    }
    try {
      setLoading(true)
      setError("")
      setPredictionResult(null)
      const res = await authenticatedFetch(`${VITE_API_URL}/ml/${selectedModel}/db`, {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id }),
      })
      if (!res.ok) throw new Error(`Failed to get prediction for ${selectedModel}`)
      const data = await res.json()

      // Convert 1/0 outputs for certain models into human-readable labels
      if (data && data.prediction != null) {
        const pNum = Number(data.prediction)
        if (selectedModel === "infertility") {
          data.prediction = pNum === 1 ? "Infertility" : "No infertility"
        } else if (selectedModel === "menstrual") {
          data.prediction = pNum === 1 ? "Irregular menstrual cycle" : "Regular menstrual cycle"
        }
      }

      setPredictionResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runSensitivity = async () => {
    if (!patient) {
      setError("Please select a patient")
      return
    }
    try {
      setLoading(true)
      setError("")
      setSensitivityResult(null)
      const res = await authenticatedFetch(`${VITE_API_URL}/ml/${selectedModel}/sensitivity/db`, {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id }),
      })
      if (!res.ok) throw new Error(`Failed to get sensitivity analysis for ${selectedModel}`)
      const data = await res.json()
      setSensitivityResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!patient) return
    try {
      const res = await authenticatedFetch(`${VITE_API_URL}/reports/${patient.id}`)
      if (!res.ok) throw new Error("Failed to download report")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `report_${patient.id}.pdf`
      link.click()
    } catch (err) {
      console.error(err)
      alert("Failed to download report")
    }
  }

  const charts = useMemo(() => {
    if (!sensitivityResult?.sensitivity) return []
    const top = sensitivityResult.sensitivity
    const chartsOut = []
    Object.keys(top).forEach((topKey) => {
      const topVal = top[topKey]
      if (topVal && typeof topVal === "object") {
        Object.keys(topVal).forEach((featureKey) => {
          const featureObj = topVal[featureKey]
          if (!featureObj?.x || !featureObj?.y) return
          const xArr = featureObj.x
          const yRaw = featureObj.y
          const data = []
          if (Array.isArray(yRaw)) {
            for (let i = 0; i < xArr.length; i++) data.push({ x: xArr[i], y: yRaw[i] })
            chartsOut.push({ title: `${topKey} — ${featureKey}`, data, seriesKeys: ["y"], original_x: featureObj.original_x, original_y: featureObj.original_y })
          } else if (typeof yRaw === "object" && yRaw !== null) {
            const seriesKeys = Object.keys(yRaw)
            for (let i = 0; i < xArr.length; i++) {
              const point = { x: xArr[i] }
              seriesKeys.forEach((sk) => (point[sk] = yRaw[sk][i]))
              data.push(point)
            }
            chartsOut.push({ title: `${topKey} — ${featureKey}`, data, seriesKeys, original_x: featureObj.original_x, original_y: featureObj.original_y })
          }
        })
      }
    })
    return chartsOut
  }, [sensitivityResult])

  const computeYDomain = (data, seriesKeys) => {
    if (!data || !seriesKeys || seriesKeys.length === 0) return ["auto", "auto"]
    let min = Infinity, max = -Infinity
    data.forEach(row => seriesKeys.forEach(k => { const v = row[k]; if (v != null && Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v) } }))
    if (!isFinite(min) || !isFinite(max)) return ["auto", "auto"]
    if (min === max) { const delta = Math.abs(min) * 0.1 || 1; return [min - delta, max + delta] }
    const pad = (max - min) * 0.08
    return [min - pad, max + pad]
  }

  const ChartCard = ({ title, data, seriesKeys, original_x, original_y }) => {
    const yDomain = computeYDomain(data, seriesKeys)
    return (
      <div className="bg-white rounded-lg shadow p-4 border border-blue-100">
        <h3 className="text-sm font-medium text-blue-700 mb-2">{title}</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" label={{ value: "Input value", position: "insideBottom", offset: -5 }} />
              <YAxis domain={yDomain} />
              <Tooltip formatter={v => typeof v === "number" ? [v.toFixed(4), "Value"] : [v, "Value"]} />
              <Legend />
              {original_x != null && <ReferenceLine x={original_x} stroke="#272ad8ff" strokeDasharray="3 3" label="original x" />}
              {original_y != null && <ReferenceLine y={original_y} stroke="#272ad8ff" strokeDasharray="3 3" label="original y" />}
              {seriesKeys.map((key, idx) => (
                <Line key={key} type="monotone" dataKey={key} stroke={PALETTE[idx % PALETTE.length]} strokeWidth={2} dot={false} name={key} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (fetchingPatient) return <div className="flex justify-center items-center h-screen"><div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div></div>
  if (!patient && id) return <div className="p-6 text-center text-red-600">Patient not found</div>
  if (user?.role !== "doctor") return <div className="p-6 text-center text-red-600">Access denied. Only doctors can view predictions.</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-8">
        {id ? (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Predictions for {patient.name}</h1>
            <button onClick={() => navigate(`/patient/${id}`)} className="text-blue-600 hover:text-blue-800">← Back</button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-blue-800 mb-6">Patient Predictions</h1>
        )}

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Patient & Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {!id && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-blue-700">Select Patient</h2>
              <select
                value={patient?.id || ""}
                onChange={(e) => setPatient(patients.find(p => p.id === e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              >
                <option value="">Choose a patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.nic || "No NIC"})</option>)}
              </select>
            </div>
          )}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-700">Select Model</h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
            >
              <option value="">Choose a model...</option>
              {availableModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6 flex-wrap">
          <button onClick={runPrediction} disabled={loading} className={`flex-1 py-3 px-6 rounded-md font-medium text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>{loading ? "Running..." : "Get Predictions"}</button>
          <button onClick={runSensitivity} disabled={loading} className={`flex-1 py-3 px-6 rounded-md font-medium text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>{loading ? "Running..." : "Run Sensitivity Analysis"}</button>
          {patient && <button onClick={downloadReport} className="flex items-center gap-2 py-3 px-6 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700"><FiDownload /> Download Report</button>}
        </div>
      </div>

      {/* Prediction Results */}
      {predictionResult && (
        <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Prediction Results</h2>
          <div className="space-y-3">
            {predictionResult.prediction !== undefined && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-200">
                <span className="font-medium text-gray-700">Prediction:</span>
                <span className="text-lg font-bold text-blue-600">{predictionResult.prediction}</span>
              </div>
            )}
            {predictionResult.predictions && Object.entries(predictionResult.predictions).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-200">
                <span className="font-medium text-gray-700">{k.replace(/_/g, " ").replace("hormone ", "")}:</span>
                <span className="text-lg font-bold text-blue-600">{v.toFixed(2)}</span>
              </div>
            ))}
            {predictionResult.confidence && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-200">
                <span className="font-medium text-gray-700">Confidence:</span>
                <span className="text-lg font-bold text-blue-600">{(predictionResult.confidence * 100).toFixed(2)}%</span>
              </div>
            )}
            {predictionResult.risk_level && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-200">
                <span className="font-medium text-gray-700">Risk Level:</span>
                <span className="text-lg font-bold text-blue-600">{predictionResult.risk_level}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sensitivity Analysis */}
      {sensitivityResult && (
        <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Sensitivity Analysis</h2>
          {!sensitivityResult.sensitivity && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="font-medium text-yellow-800">Sensitivity Analysis Data Format Issue</p>
              <p className="text-sm mt-1">Expected `sensitivity` object but didn't find one.</p>
            </div>
          )}
          {charts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {charts.map((c, idx) => <ChartCard key={`${c.title}-${idx}`} {...c} />)}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No valid sensitivity analysis data available to display.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
