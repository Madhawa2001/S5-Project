"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function PatientForm({ patientId, initialData }) {
  const navigate = useNavigate()
  const { authenticatedFetch, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [doctors, setDoctors] = useState([])
  const [includeBloodMetals, setIncludeBloodMetals] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const [formData, setFormData] = useState({
    name: "",
    nic: "",
    dob: "",
    gender: "Male",
    heightCm: "",
    weightKg: "",
    contactNumber: "",
    email: "",
    address: "",
    maritalStatus: "",
    pregnancyCount: "",
    pregnancyStatus: false,
    triedYearPregnant: false,
    vaginalDeliveries: "",
    everUsedFemaleHormones: false,
    hadHysterectomy: false,
    ovariesRemoved: false,
    everUsedBirthControlPills: false,
    doctorId: "",
    lead_umolL: "",
    mercury_umolL: "",
    cadmium_umolL: "",
    selenium_umolL: "",
    manganese_umolL: "",
  })

  useEffect(() => {
    if (user?.role === "nurse") {
      fetchDoctors()
    }
    if (initialData) {
      const hasBloodMetals = initialData.bloodMetals && initialData.bloodMetals.length > 0
      setIncludeBloodMetals(hasBloodMetals)

      setFormData({
        ...formData,
        ...initialData,
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
        doctorId: initialData.doctorId || "",
        lead_umolL: initialData.bloodMetals?.[0]?.lead_umolL || "",
        mercury_umolL: initialData.bloodMetals?.[0]?.mercury_umolL || "",
        cadmium_umolL: initialData.bloodMetals?.[0]?.cadmium_umolL || "",
        selenium_umolL: initialData.bloodMetals?.[0]?.selenium_umolL || "",
        manganese_umolL: initialData.bloodMetals?.[0]?.manganese_umolL || "",
      })
    }
  }, [initialData, user?.role])

  const fetchDoctors = async () => {
    try {
      const response = await authenticatedFetch("http://localhost:5000/patients/available-doctors")
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (err) {
      console.error("Failed to fetch doctors")
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = e.target.checked
      setFormData({ ...formData, [name]: checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" })
    }
  }

  const validateForm = () => {
    const errors = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = "Full name is required"
    }

    if (!formData.dob) {
      errors.dob = "Date of birth is required"
    } else {
      const dobDate = new Date(formData.dob)
      if (dobDate > today) {
        errors.dob = "Date of birth cannot be in the future"
      }
    }

    if (!formData.gender) {
      errors.gender = "Gender is required"
    }

    // Validate metrics are not negative
    const metricFields = ["heightCm", "weightKg", "pregnancyCount", "vaginalDeliveries"]
    metricFields.forEach((field) => {
      if (formData[field] !== "" && formData[field] !== null) {
        const value = Number.parseFloat(formData[field])
        if (value < 0) {
          errors[field] = `${field} cannot be negative`
        }
      }
    })

    // Validate blood metals are not negative if included
    if (includeBloodMetals) {
      const bloodMetalFields = ["lead_umolL", "mercury_umolL", "cadmium_umolL", "selenium_umolL", "manganese_umolL"]
      bloodMetalFields.forEach((field) => {
        if (formData[field] !== "" && formData[field] !== null) {
          const value = Number.parseFloat(formData[field])
          if (value < 0) {
            errors[field] = `${field} cannot be negative`
          }
        }
      })
    }

    // Validate vaginal deliveries <= pregnancy count
    if (formData.pregnancyCount && formData.vaginalDeliveries) {
      const pregnancies = Number.parseInt(formData.pregnancyCount)
      const deliveries = Number.parseInt(formData.vaginalDeliveries)
      if (deliveries > pregnancies) {
        errors.vaginalDeliveries = "Vaginal deliveries cannot exceed pregnancy count"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm()) {
      setError("Please fix the validation errors below")
      return
    }

    setLoading(true)

    try {
      const payload = { ...formData }

      // Convert string fields to numbers where needed
      const numericFields = [
        "heightCm",
        "weightKg",
        "pregnancyCount",
        "vaginalDeliveries",
        "lead_umolL",
        "mercury_umolL",
        "cadmium_umolL",
        "selenium_umolL",
        "manganese_umolL",
      ]

      numericFields.forEach((field) => {
        if (payload[field] !== "" && payload[field] !== null && payload[field] !== undefined) {
          const numValue = Number.parseFloat(payload[field])
          payload[field] = isNaN(numValue) ? null : numValue
        } else {
          payload[field] = null
        }
      })

      // Special handling for integer fields
      const integerFields = ["pregnancyCount", "vaginalDeliveries"]
      integerFields.forEach((field) => {
        if (payload[field] !== null) {
          payload[field] = Number.parseInt(payload[field]) || null
        }
      })

      if (!includeBloodMetals || !patientId) {
        delete payload.lead_umolL
        delete payload.mercury_umolL
        delete payload.cadmium_umolL
        delete payload.selenium_umolL
        delete payload.manganese_umolL
      }

      if (patientId) {
        // Update existing patient
        const res = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update patient")

        if (includeBloodMetals) {
          const bloodPayload = {
            lead_umolL: formData.lead_umolL ? Number.parseFloat(formData.lead_umolL) : null,
            mercury_umolL: formData.mercury_umolL ? Number.parseFloat(formData.mercury_umolL) : null,
            cadmium_umolL: formData.cadmium_umolL ? Number.parseFloat(formData.cadmium_umolL) : null,
            selenium_umolL: formData.selenium_umolL ? Number.parseFloat(formData.selenium_umolL) : null,
            manganese_umolL: formData.manganese_umolL ? Number.parseFloat(formData.manganese_umolL) : null,
          }

          try {
            await authenticatedFetch(`http://localhost:5000/bloodMetals/${patientId}`, {
              method: "POST",
              body: JSON.stringify(bloodPayload),
            })
          } catch (err) {
            console.warn("Failed to update blood metals:", err)
          }
        }

        setSuccess("Patient updated successfully")
      } else {
        // Create new patient
        const res = await authenticatedFetch("http://localhost:5000/patients", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create patient")
        const newPatient = await res.json()

        // Add blood metals if selected
        if (includeBloodMetals) {
          const bloodPayload = {
            lead_umolL: formData.lead_umolL ? Number.parseFloat(formData.lead_umolL) : null,
            mercury_umolL: formData.mercury_umolL ? Number.parseFloat(formData.mercury_umolL) : null,
            cadmium_umolL: formData.cadmium_umolL ? Number.parseFloat(formData.cadmium_umolL) : null,
            selenium_umolL: formData.selenium_umolL ? Number.parseFloat(formData.selenium_umolL) : null,
            manganese_umolL: formData.manganese_umolL ? Number.parseFloat(formData.manganese_umolL) : null,
          }

          try {
            await authenticatedFetch(`http://localhost:5000/bloodMetals/${newPatient.id}`, {
              method: "POST",
              body: JSON.stringify(bloodPayload),
            })
          } catch (err) {
            console.warn("Failed to add blood metals:", err)
          }
        }

        setSuccess("Patient added successfully")
        setTimeout(() => {
          navigate(user?.role === "nurse" ? "/nurse/patients" : "/doctor/patients")
        }, 1500)
      }
    } catch (err) {
      setError(err.message || "Failed to save patient")
    } finally {
      setLoading(false)
    }
  }

  const isFemale = formData.gender === "Female"

return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{error}</div>}

        {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm border border-green-200">{success}</div>
        )}

        <div className="border-b border-green-200 pb-4">
            <h3 className="text-lg font-semibold text-green-800">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                        validationErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number</label>
                <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                        validationErrors.dob ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {validationErrors.dob && <p className="text-red-500 text-xs mt-1">{validationErrors.dob}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
        </div>

        <div className="border-b border-green-200 pb-4 pt-4">
            <h3 className="text-lg font-semibold text-green-800">Physical Measurements</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                    type="number"
                    name="heightCm"
                    value={formData.heightCm}
                    onChange={handleChange}
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                        validationErrors.heightCm ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {validationErrors.heightCm && <p className="text-red-500 text-xs mt-1">{validationErrors.heightCm}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                    type="number"
                    name="weightKg"
                    value={formData.weightKg}
                    onChange={handleChange}
                    step="0.1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                        validationErrors.weightKg ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {validationErrors.weightKg && <p className="text-red-500 text-xs mt-1">{validationErrors.weightKg}</p>}
            </div>
        </div>

        <div className="border-b border-green-200 pb-4 pt-4">
            <h3 className="text-lg font-semibold text-green-800">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                />
            </div>
        </div>

        <div className="border-b border-green-200 pb-4 pt-4">
            <h3 className="text-lg font-semibold text-green-800">Additional Information</h3>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
            <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
            >
                <option value="">Select...</option>
                <option value="MARRIED">Married</option>
                <option value="WIDOWED">Widowed</option>
                <option value="DIVORCED">Divorced</option>
                <option value="SEPARATED">Separated</option>
                <option value="NEVER_MARRIED">Never Married</option>
                <option value="LIVING_WITH_PARTNER">Living with Partner</option>
            </select>
        </div>

        {isFemale && (
            <>
                <div className="border-b border-green-200 pb-4 pt-4">
                    <h3 className="text-lg font-semibold text-green-800">Reproductive Health (Female Only)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pregnancies</label>
                        <input
                            type="number"
                            name="pregnancyCount"
                            value={formData.pregnancyCount}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                validationErrors.pregnancyCount ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {validationErrors.pregnancyCount && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.pregnancyCount}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vaginal Deliveries</label>
                        <input
                            type="number"
                            name="vaginalDeliveries"
                            value={formData.vaginalDeliveries}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                validationErrors.vaginalDeliveries ? "border-red-500" : "border-gray-300"
                            }`}
                        />
                        {validationErrors.vaginalDeliveries && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.vaginalDeliveries}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="pregnancyStatus"
                            checked={formData.pregnancyStatus}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Currently Pregnant</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="everUsedFemaleHormones"
                            checked={formData.everUsedFemaleHormones}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Ever used female hormones</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="hadHysterectomy"
                            checked={formData.hadHysterectomy}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Had hysterectomy</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="ovariesRemoved"
                            checked={formData.ovariesRemoved}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Ovaries removed</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="everUsedBirthControlPills"
                            checked={formData.everUsedBirthControlPills}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Ever used birth control pills</span>
                    </label>
                </div>
            </>
        )}

        {user?.role === "nurse" && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Doctor</label>
                <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                >
                    <option value="">Unassigned</option>
                    {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                            {doctor.name} ({doctor.email})
                        </option>
                    ))}
                </select>
            </div>
        )}

        {!patientId && (
            <>
                <div className="border-b border-green-200 pb-4 pt-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={includeBloodMetals}
                            onChange={(e) => setIncludeBloodMetals(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-lg font-semibold text-green-800">Add Blood Metals Data (Optional)</span>
                    </label>
                </div>

                {includeBloodMetals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-md border border-green-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lead (µmol/L)</label>
                            <input
                                type="number"
                                name="lead_umolL"
                                value={formData.lead_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.lead_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.lead_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.lead_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mercury (µmol/L)</label>
                            <input
                                type="number"
                                name="mercury_umolL"
                                value={formData.mercury_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.mercury_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.mercury_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.mercury_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cadmium (µmol/L)</label>
                            <input
                                type="number"
                                name="cadmium_umolL"
                                value={formData.cadmium_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.cadmium_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.cadmium_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.cadmium_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selenium (µmol/L)</label>
                            <input
                                type="number"
                                name="selenium_umolL"
                                value={formData.selenium_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.selenium_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.selenium_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.selenium_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manganese (µmol/L)</label>
                            <input
                                type="number"
                                name="manganese_umolL"
                                value={formData.manganese_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.manganese_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.manganese_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.manganese_umolL}</p>
                            )}
                        </div>
                    </div>
                )}
            </>
        )}

        {patientId && (
            <>
                <div className="border-b border-green-200 pb-4 pt-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={includeBloodMetals}
                            onChange={(e) => setIncludeBloodMetals(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-lg font-semibold text-green-800">Blood Metals Data (Optional)</span>
                    </label>
                </div>

                {includeBloodMetals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-md border border-green-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lead (µmol/L)</label>
                            <input
                                type="number"
                                name="lead_umolL"
                                value={formData.lead_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.lead_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.lead_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.lead_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mercury (µmol/L)</label>
                            <input
                                type="number"
                                name="mercury_umolL"
                                value={formData.mercury_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.mercury_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.mercury_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.mercury_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cadmium (µmol/L)</label>
                            <input
                                type="number"
                                name="cadmium_umolL"
                                value={formData.cadmium_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.cadmium_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.cadmium_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.cadmium_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selenium (µmol/L)</label>
                            <input
                                type="number"
                                name="selenium_umolL"
                                value={formData.selenium_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.selenium_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.selenium_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.selenium_umolL}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manganese (µmol/L)</label>
                            <input
                                type="number"
                                name="manganese_umolL"
                                value={formData.manganese_umolL}
                                onChange={handleChange}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-black ${
                                    validationErrors.manganese_umolL ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {validationErrors.manganese_umolL && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.manganese_umolL}</p>
                            )}
                        </div>
                    </div>
                )}
            </>
        )}

        <div className="flex gap-4 pt-4 border-t border-green-200">
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 font-medium transition-colors"
            >
                {loading ? "Saving..." : patientId ? "Update Patient" : "Add Patient"}
            </button>
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
            >
                Cancel
            </button>
        </div>
    </form>
)
}
