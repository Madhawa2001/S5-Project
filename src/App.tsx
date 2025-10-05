import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
import { MockAuthProvider } from './contexts/MockAuthContext'; // Use mock auth
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { LabDashboard } from './pages/lab/LabDashboard';
import { NewAssessment } from './pages/lab/NewAssessment';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { PatientDetails } from './pages/doctor/PatientDetails';

function App() {
  return (
    <BrowserRouter>
      <MockAuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigation />
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigation />
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lab/dashboard"
              element={
                <ProtectedRoute allowedRoles={['lab_assistant']}>
                  <Navigation />
                  <LabDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/assessment/new"
              element={
                <ProtectedRoute allowedRoles={['lab_assistant']}>
                  <Navigation />
                  <NewAssessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Navigation />
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:id"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Navigation />
                  <PatientDetails />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </MockAuthProvider>
    </BrowserRouter>
  );
}

export default App;
