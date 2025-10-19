"use client"
import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiHome, FiUsers, FiUserCheck, FiFileText, FiClipboard } from "react-icons/fi"

const Sidebar = () => {
    const { user } = useAuth()

const getLinkClass = (isActive) => {
  return `flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 no-underline
    ${isActive
      ? "bg-green-100 text-green-700 font-semibold"
      : "text-gray-800 hover:bg-green-50 hover:text-green-700"
    }`
}

    return (
        <div className="w-64 bg-white border-r border-green-200 min-h-screen p-4">
            <nav className="space-y-2">
                {user?.role === "admin" && (
                    <>
                        <NavLink to="/admin/users" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUsers />
                            All Users
                        </NavLink>
                        <NavLink to="/requests" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUserCheck />
                            Requests
                        </NavLink>
                        <NavLink to="/admin/access-logs" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiFileText />
                            Access Logs
                        </NavLink>
                    </>
                )}

                {user?.role === "doctor" && (
                    <>
                        <NavLink to="/home" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUsers />
                            My Patients
                        </NavLink>
                        <NavLink to="/add-patient" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiClipboard />
                            Add Patient
                        </NavLink>
                        {/* <NavLink to="/doctor/report" className={({ isActive }) => getLinkClass(isActive)}>
              <FiFileText />
              My Reports
            </NavLink> */}
                        <NavLink to="/predictions" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiFileText />
                            My Predictions
                        </NavLink>
                    </>
                )}

                {user?.role === "nurse" && (
                    <>
                        <NavLink to="/home" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUsers />
                            All Patients
                        </NavLink>
                        <NavLink to="/add-patient" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiClipboard />
                            Add Patient
                        </NavLink>
                    </>
                )}
            </nav>
        </div>
    )
}

export default Sidebar
