"use client"

import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiHome, FiUsers, FiUserCheck, FiFileText, FiClipboard } from "react-icons/fi"

const Sidebar = () => {
    const { user } = useAuth()

    const getLinkClass = (isActive) => {
        return `flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 no-underline
      ${isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-800 hover:bg-blue-50 hover:text-blue-600"
            }`
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
            <nav className="space-y-2">
                {user?.role === "admin" && (
                    <>
                        <NavLink to="/admin/dashboard" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiHome />
                            Dashboard
                        </NavLink>
                        <NavLink to="/admin/users" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUsers />
                            All Users
                        </NavLink>
                        <NavLink to="/admin/requests" className={({ isActive }) => getLinkClass(isActive)}>
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
                        <NavLink to="/doctor/dashboard" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiHome />
                            Dashboard
                        </NavLink>
                        <NavLink to="/patients" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiUsers />
                            My Patients
                        </NavLink>
                        <NavLink to="/add-patient" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiClipboard />
                            Add Patient
                        </NavLink>
                        <NavLink to="/predictions" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiFileText />
                            My Predictions
                        </NavLink>
                    </>
                )}

                {user?.role === "nurse" && (
                    <>
                        <NavLink to="/nurse/dashboard" className={({ isActive }) => getLinkClass(isActive)}>
                            <FiHome />
                            Dashboard
                        </NavLink>
                        <NavLink to="/patients" className={({ isActive }) => getLinkClass(isActive)}>
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
