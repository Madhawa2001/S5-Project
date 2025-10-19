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

const PALETTE = [
  "#10b981", // green
  "#059669", // darker green
  "#34d399", // light green
  "#6ee7b7", // lighter green
  "#a7f3d0", // very light green
  "#d1fae5", // pale green
]

export default function Predictions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authenticatedFetch, user } = useAuth()

  const [patient, setPatient] = useState("")
  const [patients, setPatients] = useState([])
  const [selectedModel, setSelectedModel] = useState("hormone")
  const [predictionResult, setPredictionResult] = useState(null)
  const [sensitivityResult, setSensitivityResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fetchingPatient, setFetchingPatient] = useState(true)

  const availableModels = [
    { id: "hormone", label: "Hormone Model" },
    { id: "infertility", label: "Infertility Model" },
    { id: "menstrual", label: "Menstrual Model" },
    { id: "menopause", label: "Menopause Model" },
  ]

useEffect(() => {
  if (id) {
    fetchPatientData() // from patient details page
  } else {
    fetchAllPatients() // from sidebar (direct prediction page)
  }
}, [])

    const fetchPatientData = async () => {
    try {
      setFetchingPatient(true)
      const res = await authenticatedFetch(`http://localhost:5000/patients/${id}`)
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
      const res = await authenticatedFetch("http://localhost:5000/patients")
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
    try {
      setLoading(true)
      setError("")
      setPredictionResult(null)

      const res = await authenticatedFetch(`http://localhost:5000/ml/${selectedModel}/db`, {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id }),
      })

      if (!res.ok) {
        throw new Error(`Failed to get prediction for ${selectedModel}`)
      }

      const data = await res.json()
      setPredictionResult(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runSensitivity = async () => {
    try {
      setLoading(true)
      setError("")
      setSensitivityResult(null)

      const res = await authenticatedFetch(`http://localhost:5000/ml/${selectedModel}/sensitivity/db`, {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id }),
      })

      if (!res.ok) {
        throw new Error(`Failed to get sensitivity analysis for ${selectedModel}`)
      }

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
    const res = await authenticatedFetch(`http://localhost:5000/reports/${patient.id}`)
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
    if (!sensitivityResult || !sensitivityResult.sensitivity) return []

    const top = sensitivityResult.sensitivity
    const chartsOut = []

    Object.keys(top).forEach((topKey) => {
      const topVal = top[topKey]

      if (topVal && typeof topVal === "object") {
        Object.keys(topVal).forEach((featureKey) => {
          const featureObj = topVal[featureKey]
          if (!featureObj || !featureObj.x || !featureObj.y) return

          const xArr = featureObj.x
          const yRaw = featureObj.y

          const data = []
          if (Array.isArray(yRaw)) {
            for (let i = 0; i < xArr.length; i++) {
              data.push({
                x: xArr[i],
                y: yRaw[i],
              })
            }
            chartsOut.push({
              title: `${topKey} — ${featureKey}`,
              data,
              seriesKeys: ["y"],
              original_x: featureObj.original_x,
              original_y: featureObj.original_y,
            })
          } else if (typeof yRaw === "object" && yRaw !== null) {
            const seriesKeys = Object.keys(yRaw)
            for (let i = 0; i < xArr.length; i++) {
              const point = { x: xArr[i] }
              seriesKeys.forEach((sk) => {
                point[sk] = yRaw[sk][i]
              })
              data.push(point)
            }
            chartsOut.push({
              title: `${topKey} — ${featureKey}`,
              data,
              seriesKeys,
              original_x: featureObj.original_x,
              original_y: featureObj.original_y,
            })
          }
        })
      }
    })

    return chartsOut
  }, [sensitivityResult])

  const computeYDomain = (data, seriesKeys) => {
    if (!data || data.length === 0 || !seriesKeys || seriesKeys.length === 0) return ["auto", "auto"]

    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY

    for (const row of data) {
      for (const key of seriesKeys) {
        const v = row[key]
        if (v === null || v === undefined || Number.isNaN(v)) continue
        const num = Number(v)
        if (!Number.isFinite(num)) continue
        if (num < min) min = num
        if (num > max) max = num
      }
    }

    if (!isFinite(min) || !isFinite(max)) return ["auto", "auto"]
    if (min === max) {
      const delta = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1
      return [min - delta, max + delta]
    }
    const pad = (max - min) * 0.08
    return [min - pad, max + pad]
  }

  const ChartCard = ({ title, data, seriesKeys, original_x, original_y }) => {
    const yDomain = computeYDomain(data, seriesKeys)

    return (
      <div className="bg-white rounded-lg shadow p-4 border border-green-100">
        <h3 className="text-sm font-medium text-green-700 mb-2">{title}</h3>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 1) return Number(v).toLocaleString()
                  return Number(v).toPrecision(3)
                }}
                label={{
                  value: "Input value",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis domain={yDomain} />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === "number") return [Number(value).toFixed(4), "Value"]
                  return [value, "Value"]
                }}
              />
              <Legend />
              {typeof original_x === "number" && (
                <ReferenceLine x={original_x} stroke="#10b981" strokeDasharray="3 3" label="original x" />
              )}
              {typeof original_y === "number" && (
                <ReferenceLine y={original_y} stroke="#059669" strokeDasharray="3 3" label="original y" />
              )}

              {seriesKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  dot={false}
                  stroke={PALETTE[idx % PALETTE.length]}
                  strokeWidth={2}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (fetchingPatient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-green-600 rounded-full"></div>
      </div>
    )
  }

  if (!patient && id) {
    return <div className="p-6 text-center text-red-600">Patient not found</div>
  }

  if (user?.role !== "doctor") {
    return <div className="p-6 text-center text-red-600">Access denied. Only doctors can view predictions.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6 text-black">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg border border-green-200 p-8">
          {id ? (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-green-800">Predictions for {patient.name}</h1>
            <button onClick={() => navigate(`/patient/${id}`)} className="text-green-600 hover:text-green-800">
              ← Back
            </button>
          </div>
          ) : (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-green-800">Patient Predictions</h1>
          </div>
          )}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-green-700">Select Model</h2>
              <select
                value={patient.id}
                onChange={(e) => {
                  const selected = patients.find(p => p.id === e.target.value)
                  setPatient(selected || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} ({patient.nic || "No NIC"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-green-700">Select Model</h2>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a model...</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={runPrediction}
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {loading ? "Running..." : "Get Predictions"}
            </button>

            <button
              onClick={runSensitivity}
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md font-medium text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {loading ? "Running..." : "Run Sensitivity Analysis"}
            </button>
          </div>
        </div>

        {predictionResult && (
          <div className="bg-white rounded-lg shadow-lg border border-green-200 p-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Prediction Results</h2>
            <div className="space-y-3">
              {predictionResult.prediction !== undefined && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                  <span className="font-medium text-gray-700">Prediction:</span>
                  <span className="text-lg font-bold text-green-600">{predictionResult.prediction}</span>
                </div>
              )}

              {predictionResult.predictions && (
                <>
                  {predictionResult.predictions.hormone_testosterone !== undefined && (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                      <span className="font-medium text-gray-700">Testosterone:</span>
                      <span className="text-lg font-bold text-green-600">
                        {predictionResult.predictions.hormone_testosterone.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {predictionResult.predictions.hormone_estradiol !== undefined && (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                      <span className="font-medium text-gray-700">Estradiol:</span>
                      <span className="text-lg font-bold text-green-600">
                        {predictionResult.predictions.hormone_estradiol.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {predictionResult.predictions.hormone_shbg !== undefined && (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                      <span className="font-medium text-gray-700">SHBG:</span>
                      <span className="text-lg font-bold text-green-600">
                        {predictionResult.predictions.hormone_shbg.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {predictionResult.confidence && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                  <span className="font-medium text-gray-700">Confidence:</span>
                  <span className="text-lg font-bold text-green-600">
                    {(predictionResult.confidence * 100).toFixed(2)}%
                  </span>
                </div>
              )}

              {predictionResult.risk_level && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-md border border-green-200">
                  <span className="font-medium text-gray-700">Risk Level:</span>
                  <span className="text-lg font-bold text-green-600">{predictionResult.risk_level}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {sensitivityResult && (
          <div className="bg-white rounded-lg shadow-lg border border-green-200 p-8">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Sensitivity Analysis</h2>

            {!sensitivityResult.sensitivity && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="text-yellow-800">
                  <p className="font-medium">Sensitivity Analysis Data Format Issue</p>
                  <p className="text-sm mt-1">Expected `sensitivity` object but didn't find one.</p>
                </div>
              </div>
            )}

            {charts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {charts.map((c, idx) => (
                  <ChartCard
                    key={`${c.title}-${idx}`}
                    title={c.title}
                    data={c.data}
                    seriesKeys={c.seriesKeys}
                    original_x={c.original_x}
                    original_y={c.original_y}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No valid sensitivity analysis data available to display.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
