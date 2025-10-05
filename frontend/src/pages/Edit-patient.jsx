"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function EditPatient() {
    const location = useLocation()
    const navigate = useNavigate()
    const { authenticatedFetch, isLoggedIn, user } = useAuth()

    const patientId = location.state?.patient?.id
    if (!patientId) navigate("/home")

    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)

    // Basic Details
    const [name, setName] = useState("")
    const [dob, setDob] = useState("")
    const [ageYears, setAgeYears] = useState("")
    const [ageMonths, setAgeMonths] = useState("")
    const [gender, setGender] = useState("")
    const [pregnancyStatus, setPregnancyStatus] = useState(false)
    const [pregnancyCount, setPregnancyCount] = useState("")
    const [diagnosis, setDiagnosis] = useState("")

    // Doctor selection for nurse
    const [doctors, setDoctors] = useState([])
    const [selectedDoctorId, setSelectedDoctorId] = useState("")

    // Blood Metals
    const [lead, setLead] = useState("")
    const [mercury, setMercury] = useState("")
    const [cadmium, setCadmium] = useState("")
    const [selenium, setSelenium] = useState("")
    const [manganese, setManganese] = useState("")

    // Calculate age from DOB
    const calculateAge = (value) => {
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

    // Fetch patient details
    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                setLoading(true)
                const res = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`)
                if (!res.ok) throw new Error("Failed to fetch patient details")
                const data = await res.json()
                setPatient(data)

                setName(data.name || "")
                if (data.ageYears !== undefined && data.ageMonths !== undefined) {
                    const today = new Date()
                    const approxDOB = new Date(today.getFullYear() - data.ageYears, today.getMonth() - data.ageMonths, today.getDate())
                    setDob(approxDOB.toISOString().split("T")[0])
                    calculateAge(approxDOB.toISOString().split("T")[0])
                }
                setGender(data.gender || "")
                setPregnancyStatus(data.pregnancyStatus || false)
                setPregnancyCount(data.pregnancyCount || "")
                setDiagnosis(data.diagnosis || "")

                // Preselect assigned doctor if nurse
                if (user.role === "nurse" && data.doctor) {
                    setSelectedDoctorId(data.doctor.id)
                }

                const latestBlood = data.bloodMetals?.[0] || {}
                setLead(latestBlood.lead_umolL ?? "")
                setMercury(latestBlood.mercury_umolL ?? "")
                setCadmium(latestBlood.cadmium_umolL ?? "")
                setSelenium(latestBlood.selenium_umolL ?? "")
                setManganese(latestBlood.manganese_umolL ?? "")
            } catch (err) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchPatientDetails()
    }, [authenticatedFetch, patientId, user.role])

    // Fetch doctors if nurse
    useEffect(() => {
        const fetchDoctors = async () => {
            if (user.role === "nurse") {
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
    }, [authenticatedFetch, user.role])

    const handleBasicContinue = () => setStep(2)

    const handleSubmit = async () => {
        if (user.role === "nurse" && !selectedDoctorId) {
            alert("Please select a doctor")
            return
        }

        setIsSubmitting(true)
        setError("")
        try {
            const basicData = {
                name,
                ageYears: Number.parseInt(ageYears),
                ageMonths: Number.parseInt(ageMonths),
                gender,
                pregnancyStatus: gender === "female" ? pregnancyStatus : false,
                pregnancyCount: gender === "female" ? (pregnancyCount ? Number.parseInt(pregnancyCount) : 0) : null,
                diagnosis,
                doctorId: user.role === "nurse" ? selectedDoctorId : undefined,
            }

            const resBasic = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`, {
                method: "PUT",
                body: JSON.stringify(basicData),
            })
            if (!resBasic.ok) throw new Error("Failed to update patient basic details")

            const bloodData = {
                lead_umolL: lead ? parseFloat(lead) : null,
                mercury_umolL: mercury ? parseFloat(mercury) : null,
                cadmium_umolL: cadmium ? parseFloat(cadmium) : null,
                selenium_umolL: selenium ? parseFloat(selenium) : null,
                manganese_umolL: manganese ? parseFloat(manganese) : null,
            }
            const resBlood = await authenticatedFetch(`http://localhost:5000/bloodMetals/${patientId}`, {
                method: "POST",
                body: JSON.stringify(bloodData),
            })
            if (!resBlood.ok) throw new Error("Failed to update blood metals")

            alert("Patient updated successfully!")
            navigate(`/patient/${patientId}`)
        } catch (err) {
            console.error(err)
            setError(err.message || "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="text-center py-12">Loading...</div>

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
                    <h1 className="text-3xl font-bold text-green-800">Edit Patient Details</h1>
                    <p className="text-green-600">Update patient demographics and blood metal details below</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg border border-green-200">
                    <div className="border-b border-green-100 p-6">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h2 className="text-xl font-semibold text-green-800">{step === 1 ? "Basic Details" : "Blood Metal Details"}</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-green-700">Patient Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Date of Birth</label>
                                    <input type="date" value={dob} onChange={e => calculateAge(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Age (Years)</label>
                                    <input type="number" value={ageYears} readOnly className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black bg-gray-100" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Age (Months)</label>
                                    <input type="number" value={ageMonths} readOnly className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black bg-gray-100" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Gender</label>
                                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black">
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
                                        onChange={e => setPregnancyCount(e.target.value)}
                                        disabled={gender === "male"}
                                        className={`w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black ${gender === "male" ? "bg-gray-100" : ""}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Currently Pregnant</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" checked={pregnancyStatus === true} onChange={() => setPregnancyStatus(true)} disabled={gender === "male"} className="text-green-600" />
                                            <span className={`text-black ${gender === "male" ? "text-gray-400" : ""}`}>Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" checked={pregnancyStatus === false} onChange={() => setPregnancyStatus(false)} disabled={gender === "male"} className="text-green-600" />
                                            <span className={`text-black ${gender === "male" ? "text-gray-400" : ""}`}>No</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-green-700">Diagnosis / Notes</label>
                                    <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
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
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[["Lead (µmol/L)", lead, setLead], ["Mercury (µmol/L)", mercury, setMercury], ["Cadmium (µmol/L)", cadmium, setCadmium], ["Selenium (µmol/L)", selenium, setSelenium], ["Manganese (µmol/L)", manganese, setManganese]].map(([label, val, setVal]) => (
                                    <div key={label}>
                                        <label className="block text-sm font-medium text-green-700">{label}</label>
                                        <input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t border-green-100 gap-4">
                            {step === 2 && <button onClick={() => setStep(1)} className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-6 rounded-md transition-colors">Back</button>}
                            {step === 1 && <button onClick={handleBasicContinue} className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors">Continue</button>}
                            {step === 2 && <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors">{isSubmitting ? "Updating..." : "Predict & Save"}</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
