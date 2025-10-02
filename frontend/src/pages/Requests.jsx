"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useEffect, useState } from "react"

export default function Requests() {
  const navigate = useNavigate()
  const { logout, user, authenticatedFetch, isLoggedIn } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (user?.role !== "admin") {
      navigate("/home")
      return
    }

    fetchRequests()
  }, [user, isLoggedIn, navigate])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch("/api/requests")

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        throw new Error("Failed to fetch requests")
      }
    } catch (err) {
      console.error("Error fetching requests:", err)
      setError("Failed to load registration requests")
      if (isLoggedIn) {
        navigate("/home")
      } else {
        navigate("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId, action) => {
    try {
      setProcessingId(requestId)
      const response = await authenticatedFetch(`/api/requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        setRequests(requests.filter((req) => req.id !== requestId))
      } else {
        throw new Error(`Failed to ${action} request`)
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err)
      alert(`Failed to ${action} request. Please try again.`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800">Registration Requests</h1>
              <p className="text-sm text-green-600">Review and approve user registration requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/home")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md border border-green-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-green-800">Pending Requests</h2>
            <span className="text-sm text-green-600">{requests.length} pending</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-green-900">No pending requests</h3>
              <p className="mt-1 text-sm text-green-500">All registration requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-green-900">{request.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          Pending
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                        <div>
                          <span className="font-medium">Email:</span> {request.email}
                        </div>
                        <div>
                          <span className="font-medium">Request Date:</span> {request.requestDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleRequest(request.id, "approve")}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium flex items-center gap-2"
                      >
                        {processingId === request.id ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
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
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, "reject")}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium flex items-center gap-2"
                      >
                        {processingId === request.id ? (
                          "Processing..."
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
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
