import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

// Layout components
import Sidebar from "./components/Layout/Sidebar";
import Navbar from "./components/Layout/Navbar";

// Pages
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import PatientList from "./pages/Patients/PatientList";
import HormonePrediction from "./pages/Predictions/HormonePrediction";
import InfertilityPrediction from "./pages/Predictions/InfertilityPrediction";

const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#F4F6F7]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientList />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions/hormone"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HormonePrediction />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions/infertility"
          element={
            <ProtectedRoute>
              <AppLayout>
                <InfertilityPrediction />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
