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
    const VITE_API_URL = import.meta.env.VITE_API_URL;

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
        everTreatedForPID: false,
        ageAtLastPeriod: "",
        doctorId: "",
        lead_umolL: "",
        mercury_umolL: "",
        cadmium_umolL: "",
        selenium_umolL: "",
        manganese_umolL: "",
    })

    useEffect(() => {
        if (user?.role === "nurse") fetchDoctors()
        if (initialData) {
            const hasBloodMetals = initialData.bloodMetals?.length > 0
            setIncludeBloodMetals(hasBloodMetals)

            setFormData({
                ...formData,
                ...initialData,
                dob: initialData.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
                pregnancyCount: (() => {
                    const pc = initialData.pregnancyCount
                    if (pc == null || pc === "") return ""
                    // If backend sent a number (age in years) compute date = dob + age years
                    const dob = initialData.dob ? new Date(initialData.dob) : null
                    if (typeof pc === "number" && dob && !isNaN(dob)) {
                        const d = new Date(dob)
                        d.setFullYear(d.getFullYear() + pc)
                        return d.toISOString().split("T")[0]
                    }
                    // If backend sent a numeric string, treat like the number case
                    const asNum = Number(pc)
                    if (!Number.isNaN(asNum) && dob && !isNaN(dob)) {
                        const d = new Date(dob)
                        d.setFullYear(d.getFullYear() + asNum)
                        return d.toISOString().split("T")[0]
                    }
                    // Otherwise try to parse as a date string
                    const parsed = new Date(pc)
                    return !isNaN(parsed) ? parsed.toISOString().split("T")[0] : ""
                })(),
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
            const response = await authenticatedFetch(`${VITE_API_URL}/patients/available-doctors`)
            if (response.ok) {
                const data = await response.json()
                setDoctors(data)
            }
        } catch (err) {
            console.error("Failed to fetch doctors")
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value })
        if (validationErrors[name]) setValidationErrors({ ...validationErrors, [name]: "" })
    }

    const validateForm = () => {
        const errors = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Full Name
        if (!formData.name?.trim()) errors.name = "Full name is required";

        // Date of Birth
        if (!formData.dob) {
            errors.dob = "Date of birth is required";
        } else if (new Date(formData.dob) > today) {
            errors.dob = "Date of birth cannot be in the future";
        }

        // Age at last period
        if (formData.pregnancyCount) {
            if (new Date(formData.pregnancyCount) > today)
                errors.pregnancyCount = "Age at last period cannot be in the future";

            if (new Date(formData.pregnancyCount) < new Date(formData.dob))
                errors.pregnancyCount = "Age at last period cannot be before DOB";
        }

        // Gender
        if (!formData.gender) errors.gender = "Gender is required";

        // NIC validation
        const nic = (formData.nic ?? "").toString().trim();
        if (nic && !(/^\d{12}$/.test(nic) || /^\d{9}[vV]$/.test(nic))) {
            errors.nic = "NIC must be 12 digits or 9 digits followed by 'V' (10 characters)";
        }

        // ⚠️ Do NOT mutate formData directly here!
        // If you need to clean the NIC value, do it when handling input or with setFormData

        // Height / Weight validation
        ["heightCm", "weightKg"].forEach((field) => {
            const value = formData?.[field] ?? "";
            if (value !== "" && Number(value) < 0) {
                errors[field] = `${field} cannot be negative`;
            }
        });

        // Blood metal fields (if included)
        if (includeBloodMetals) {
            ["lead_umolL", "mercury_umolL", "cadmium_umolL", "selenium_umolL", "manganese_umolL"].forEach(
                (field) => {
                    const value = formData?.[field] ?? "";
                    if (value !== "" && Number(value) < 0) {
                        errors[field] = `${field} cannot be negative`;
                    }
                }
            );
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        if (!validateForm()) return setError("Please fix the validation errors below")

        setLoading(true)
        try {
            const payload = { ...formData }
                ;[
                    "heightCm",
                    "weightKg",
                    "pregnancyCount",
                    "vaginalDeliveries",
                    "lead_umolL",
                    "mercury_umolL",
                    "cadmium_umolL",
                    "selenium_umolL",
                    "manganese_umolL",
                ].forEach((field) => {
                    const num = Number(payload[field])
                    payload[field] = isNaN(num) ? null : num
                })

            // compute age at last period (years) from dob and the date stored in pregnancyCount
            if (formData.pregnancyCount && formData.dob) {
                const lastPeriod = new Date(formData.pregnancyCount)
                const birth = new Date(formData.dob)
                if (!isNaN(lastPeriod) && !isNaN(birth) && lastPeriod >= birth) {
                    let years = lastPeriod.getFullYear() - birth.getFullYear()
                    const monthDiff = lastPeriod.getMonth() - birth.getMonth()
                    if (monthDiff < 0 || (monthDiff === 0 && lastPeriod.getDate() < birth.getDate())) years--
                    payload.pregnancyCount = Math.max(0, Math.floor(years))
                } else {
                    payload.pregnancyCount = null
                }
            } else {
                payload.pregnancyCount = null
            }
            //   ;["vaginalDeliveries"].forEach((field) => {
            //     if (payload[field] !== null) payload[field] = parseInt(payload[field]) || null
            //   })

            if (!includeBloodMetals || !patientId) {
                ;["lead_umolL", "mercury_umolL", "cadmium_umolL", "selenium_umolL", "manganese_umolL"].forEach(
                    (field) => delete payload[field]
                )
            }

            if (patientId) {
                const res = await authenticatedFetch(`${VITE_API_URL}/patients/${patientId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error("Failed to update patient")

                if (includeBloodMetals) {
                    const bloodPayload = {
                        lead_umolL: Number(formData.lead_umolL) || null,
                        mercury_umolL: Number(formData.mercury_umolL) || null,
                        cadmium_umolL: Number(formData.cadmium_umolL) || null,
                        selenium_umolL: Number(formData.selenium_umolL) || null,
                        manganese_umolL: Number(formData.manganese_umolL) || null,
                    }
                    try {
                        await authenticatedFetch(`${VITE_API_URL}/bloodMetals/${patientId}`, {
                            method: "POST",
                            body: JSON.stringify(bloodPayload),
                        })
                    } catch (err) {
                        console.warn("Failed to update blood metals:", err)
                    }
                }
                setSuccess("Patient updated successfully")
            } else {
                const res = await authenticatedFetch(`${VITE_API_URL}/patients`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error("Failed to create patient")
                const newPatient = await res.json()

                if (includeBloodMetals) {
                    const bloodPayload = {
                        lead_umolL: Number(formData.lead_umolL) || null,
                        mercury_umolL: Number(formData.mercury_umolL) || null,
                        cadmium_umolL: Number(formData.cadmium_umolL) || null,
                        selenium_umolL: Number(formData.selenium_umolL) || null,
                        manganese_umolL: Number(formData.manganese_umolL) || null,
                    }
                    try {
                        await authenticatedFetch(`${VITE_API_URL}/bloodMetals/${newPatient.id}`, {
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
        <form className="bg-white shadow-md rounded-xl p-6 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">{error}</div>}
            {success && <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">{success}</div>}

            {/* Basic Info */}
            <Section title="Basic Information">
                <div className="text-black">
                    <Input label="Full Name *" name="name" value={formData.name} onChange={handleChange} error={validationErrors.name} />
                </div>
                <div className="text-black">
                    <Input label="NIC Number" name="nic" value={formData.nic} onChange={handleChange} error={validationErrors.nic} />
                </div>
                <div className="text-black">
                    <Input label="Date of Birth *" type="date" name="dob" value={formData.dob} onChange={handleChange} error={validationErrors.dob} />
                </div>
                <div className="text-black">
                    <Select label="Gender *" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female"]} />
                </div>
            </Section>

            {/* Physical Measurements */}
            <Section title="Physical Measurements">
                <div className="text-black">
                    <Input label="Height (cm)" type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} error={validationErrors.heightCm} />
                </div>
                <div className="text-black">
                    <Input label="Weight (kg)" type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} error={validationErrors.weightKg} />
                </div>
            </Section>

            {/* Contact Info */}
            <Section title="Contact Information">
                <div className="text-black">
                    <Input label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                </div>
                <div className="text-black">
                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="text-black">
                    <Textarea label="Address" name="address" value={formData.address} onChange={handleChange} />
                </div>
            </Section>

            {/* Additional Info */}
            <Section title="Additional Information">
                <div className="text-black">
                    <Select
                        label="Marital Status"
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        options={[
                            "Select...",
                            "MARRIED",
                            "WIDOWED",
                            "DIVORCED",
                            "SEPARATED",
                            "NEVER_MARRIED",
                            "LIVING_WITH_PARTNER",
                        ]}
                    />
                </div>
            </Section>

            {/* Female Reproductive */}
            {isFemale && (
                <Section title="Reproductive Health (Female Only)">
                    <div className="text-black md:col-span-2">
                        <Input
                            label="Date of Last Period"
                            type="date"
                            name="pregnancyCount"
                            value={formData.pregnancyCount}
                            onChange={handleChange}
                            error={validationErrors.pregnancyCount}
                        />
                    </div>

                    <div className="text-black md:col-span-2 space-y-2">
                        <div>
                            <Checkbox
                                label="Currently Pregnant"
                                name="pregnancyStatus"
                                checked={formData.pregnancyStatus}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Checkbox
                                label="Ever used female hormones"
                                name="everUsedFemaleHormones"
                                checked={formData.everUsedFemaleHormones}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Checkbox
                                label="Had hysterectomy"
                                name="hadHysterectomy"
                                checked={formData.hadHysterectomy}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Checkbox
                                label="Ovaries removed"
                                name="ovariesRemoved"
                                checked={formData.ovariesRemoved}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Checkbox
                                label="Ever used birth control pills"
                                name="everUsedBirthControlPills"
                                checked={formData.everUsedBirthControlPills}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Checkbox
                                label="Ever treated for PID (Pelvic Inflammatory Disease)"
                                name="triedYearPregnant"
                                checked={formData.triedYearPregnant}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </Section>
            )}
            {user?.role === "nurse" && (
                <Section title="Assign Doctor">
                    <div className="text-black">
                        <Select
                            name="doctorId"
                            value={formData.doctorId}
                            onChange={handleChange}
                            options={["Unassigned", ...doctors.map((d) => `${d.name} (${d.email})`)]}
                        />
                    </div>
                </Section>
            )}

            {/* Blood Metals */}
            <Section title={`${patientId ? "Blood Metals Data (Optional)" : "Add Blood Metals Data (Optional)"}`}>
                <div className="text-black">
                    <Checkbox label="Include Blood Metals" checked={includeBloodMetals} onChange={(e) => setIncludeBloodMetals(e.target.checked)} />
                </div>
                {includeBloodMetals && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-md border border-blue-200 text-black">
                        {["lead", "mercury", "cadmium", "selenium", "manganese"].map((metal) => (
                            <div key={metal} className="text-black">
                                <Input
                                    label={`${metal.charAt(0).toUpperCase() + metal.slice(1)} (µmol/L)`}
                                    type="number"
                                    name={`${metal}_umolL`}
                                    value={formData[`${metal}_umolL`]}
                                    onChange={handleChange}
                                    step="0.01"
                                    error={validationErrors[`${metal}_umolL`]}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors">
                    {loading ? "Saving..." : patientId ? "Update Patient" : "Add Patient"}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors">
                    Cancel
                </button>
            </div>
        </form>
    )
}

// --- Helper Components ---
const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-200 pb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
)

const Input = ({ label, name, value, onChange, type = "text", error, step }) => (
    <div className="flex flex-col">
        <label className="text-gray-700 font-medium mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            step={step}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? "border-red-500" : "border-gray-300"
                }`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
)

const Select = ({ label, name, value, onChange, options }) => (
    <div className="flex flex-col">
        <label className="text-gray-700 font-medium mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            {options.map((opt, i) => (
                <option key={i} value={opt === "Unassigned" ? "" : opt}>
                    {opt}
                </option>
            ))}
        </select>
    </div>
)

const Textarea = ({ label, name, value, onChange }) => (
    <div className="flex flex-col md:col-span-2">
        <label className="text-gray-700 font-medium mb-1">{label}</label>
        <textarea name={name} value={value} onChange={onChange} rows={2} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
)

const Checkbox = ({ label, name, checked, onChange }) => (
    <label className="flex items-center gap-2">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
        <span className="text-gray-700">{label}</span>
    </label>
)
