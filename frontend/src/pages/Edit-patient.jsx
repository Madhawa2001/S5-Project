"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function EditPatient() {
    const location = useLocation()
    const navigate = useNavigate()
    const { authenticatedFetch, isLoggedIn } = useAuth()

    const patientId = location.state?.patient?.id
    if (!patientId) navigate("/home")

    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [step, setStep] = useState(1) // 1 = Basic, 2 = Blood Metals

    // Basic Details
    const [name, setName] = useState("")
    const [ageYears, setAgeYears] = useState("")
    const [ageMonths, setAgeMonths] = useState(0)
    const [gender, setGender] = useState("")
    const [pregnancyStatus, setPregnancyStatus] = useState(false)
    const [pregnancyCount, setPregnancyCount] = useState(0)
    const [diagnosis, setDiagnosis] = useState("")

    // Blood Metals
    const [lead, setLead] = useState("")
    const [mercury, setMercury] = useState("")
    const [cadmium, setCadmium] = useState("")
    const [selenium, setSelenium] = useState("")
    const [manganese, setManganese] = useState("")

    // Fetch patient details on mount
    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                setLoading(true)
                const res = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`)
                if (!res.ok) throw new Error("Failed to fetch patient details")
                const data = await res.json()
                setPatient(data)

                // Basic details
                setName(data.name || "")
                setAgeYears(data.ageYears || "")
                setAgeMonths(data.ageMonths || 0)
                setGender(data.gender || "")
                setPregnancyStatus(data.pregnancyStatus || false)
                setPregnancyCount(data.pregnancyCount || 0)
                setDiagnosis(data.diagnosis || "")

                // Blood metals
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
    }, [authenticatedFetch, patientId])

    const handleBasicContinue = () => setStep(2)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError("")
        try {
            // Update Basic Details
            const basicData = { name, ageYears, ageMonths, gender, pregnancyStatus, pregnancyCount, diagnosis }
            const resBasic = await authenticatedFetch(`http://localhost:5000/patients/${patientId}`, {
                method: "PUT",
                body: JSON.stringify(basicData),
            })
            if (!resBasic.ok) throw new Error("Failed to update patient basic details")

            // Update Blood Metals
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
                {/* Back button */}
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
                    <p className="text-green-600">
                        Update patient demographics and blood metal details below
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg border border-green-200">
                    <div className="border-b border-green-100 p-6">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h2 className="text-xl font-semibold text-green-800">
                                {step === 1 ? "Basic Details" : "Blood Metal Details"}
                            </h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-green-700">Patient Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Age (Years)</label>
                                    <input type="number" value={ageYears} onChange={e => setAgeYears(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Age (Months)</label>
                                    <input type="number" value={ageMonths} onChange={e => setAgeMonths(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
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
                                    <input type="number" value={pregnancyCount} onChange={e => setPregnancyCount(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-green-700">Currently Pregnant</label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" checked={pregnancyStatus === true} onChange={() => setPregnancyStatus(true)} className="text-green-600" />
                                            <span className="text-black">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" checked={pregnancyStatus === false} onChange={() => setPregnancyStatus(false)} className="text-green-600" />
                                            <span className="text-black">No</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-green-700">Diagnosis / Notes</label>
                                    <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
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
                                        <input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)} className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 text-black" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t border-green-100 gap-4">
                            {step === 2 && (
                                <button onClick={() => setStep(1)} className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-6 rounded-md transition-colors">
                                    Back
                                </button>
                            )}

                            {step === 1 && (
                                <button onClick={handleBasicContinue} className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors">
                                    Continue
                                </button>
                            )}

                            {step === 2 && (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-6 rounded-md transition-colors">
                                    {isSubmitting ? "Updating..." : "Predict & Save"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
