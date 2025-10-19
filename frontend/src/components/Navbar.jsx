"use client"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiLogOut, FiUser } from "react-icons/fi"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="bg-white border-b border-green-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Medical System</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <FiUser className="text-green-600" />
            <span className="text-sm font-medium">{user?.name || user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
