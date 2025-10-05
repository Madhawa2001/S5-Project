import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../contexts/MockAuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserRole } from '../types';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'doctor' as UserRole,
    credentials: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.role,
      formData.credentials
    );

    if (signUpError) {
      setError(signUpError);
      setIsLoading(false);
      return;
    }

    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-card p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Activity className="w-12 h-12 text-primary-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created and is awaiting administrator approval. You will be able to access the platform once your account has been reviewed and approved.
          </p>
          <Button onClick={() => navigate('/login')} variant="primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="bg-white rounded-lg shadow-card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Activity className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Register for ReproSight Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Create a password"
            helperText="Minimum 6 characters"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm your password"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              required
            >
              <option value="doctor">Doctor/Clinician</option>
              <option value="lab_assistant">Lab Assistant</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Credentials
            </label>
            <textarea
              value={formData.credentials}
              onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
              placeholder="Enter your professional qualifications and credentials"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 min-h-[100px]"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Include relevant licenses, certifications, and experience
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
            <p className="text-sm text-blue-900">
              Your account will require administrator approval before access is granted.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-risk-high px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Register
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
