"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function Requests() {
  const navigate = useNavigate()
  const { logout, user, authenticatedFetch, isLoggedIn } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState(null)
  const VITE_API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }
    if (user?.role !== "admin") {
      navigate("/admin/dashboard")
      return
    }
    fetchRequests()
  }, [user, isLoggedIn, navigate])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`${VITE_API_URL}/admin/pending`)
      if (response.ok) {
        const data = await response.json()
        const formatted = data.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.roles && r.roles.length > 0 ? r.roles[0] : "",
          requestDate: new Date(r.createdAt).toLocaleDateString(),
          selectedRole: r.roles && r.roles.length > 0 ? r.roles[0] : "", // ✅ initialize selectedRole properly
        }))
        setRequests(formatted)
      } else {
        throw new Error("Failed to fetch requests")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to load registration requests")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (id, value) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, selectedRole: value } : r
      )
    )
  }

  const handleRequest = async (id, action, role) => {
    try {
      setProcessingId(id)

      // 👇 use let so we can reassign
      let selectedRole = role

      if (!selectedRole) {
        const reqItem = requests.find(r => r.id === id)
        selectedRole = reqItem?.selectedRole || ""
      }

      console.log("Handling request:", id, action, selectedRole)

      if (action === "approve") {
        // ✅ Approve the user
        const approveResp = await authenticatedFetch(`${VITE_API_URL}/admin/approve/${id}`, {
          method: "POST"
        })
        if (!approveResp.ok) throw new Error("Failed to approve request")

        // ✅ Assign role if selected
        if (selectedRole) {
          const assignRoleResp = await authenticatedFetch(`${VITE_API_URL}/admin/assign-role`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: id, roleName: selectedRole }),
          })
          if (!assignRoleResp.ok) throw new Error("Failed to assign role")
        }
      }

      // Remove processed request from the list
      setRequests(requests.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      alert(`Failed to ${action} request`)
    } finally {
      setProcessingId(null)
    }
  }


  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Registration Requests</h1>
            <p className="text-sm text-blue-600">Review and approve user registration requests</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-blue-800">Pending Requests</h2>
            <span className="text-sm text-blue-600">{requests.length} pending</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-blue-900">No pending requests</h3>
              <p className="mt-1 text-sm text-blue-500">All registration requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-blue-900">{req.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                        Pending
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p><span className="font-medium">Email:</span> {req.email}</p>
                      <p><span className="font-medium">Request Date:</span> {req.requestDate}</p>
                      <p><span className="font-medium">Role:</span> {req.role || req.selectedRole}</p>
                      {/* 🆕 Role Dropdown */}
                      {/* <div className="mt-2">
                        <label className="text-sm text-blue-700 font-medium mr-2">Assign Role:</label>
                        <select
                          className="border rounded-md p-1 text-sm"
                          value={req.selectedRole}
                          onChange={(e) => handleRoleChange(req.id, e.target.value)}
                        >
                          <option value="">Select role</option>
                          <option value="doctor">Doctor</option>
                          <option value="nurse">Nurse</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div> */}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, "approve", req.role)}
                      disabled={processingId === req.id || (!req.role && !req.selectedRole)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium flex items-center gap-2"
                    >
                      {processingId === req.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, "reject", req.role)}
                      disabled={processingId === req.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium flex items-center gap-2"
                    >
                      {processingId === req.id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
