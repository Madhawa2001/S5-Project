"use client"

import React from "react"
import { Link } from "react-router-dom"
import Layout from "../../components/Layout"
import { FiUsers, FiUserCheck, FiFileText } from "react-icons/fi"

export default function AdminDashboard() {
    return (
        <div className="max-w-7xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Requests */}
                <Link
                    to="/admin/requests"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <FiUserCheck className="text-yellow-600 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Pending Users</h3>
                            <p className="text-sm text-gray-600">Approve new registrations</p>
                        </div>
                    </div>
                </Link>

                {/* All Users */}
                <Link
                    to="/admin/users"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FiUsers className="text-blue-600 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">All Users</h3>
                            <p className="text-sm text-gray-600">Manage system users</p>
                        </div>
                    </div>
                </Link>

                {/* Access Logs */}
                <Link
                    to="/admin/logs"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <FiFileText className="text-green-600 text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Access Logs</h3>
                            <p className="text-sm text-gray-600">View system activity</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
