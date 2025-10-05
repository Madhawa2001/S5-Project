import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../contexts/MockAuthContext'; // Use mock auth
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false);
      return
    }

    setIsLoading(false);
  };

  if (user) {
    if (user.approval_status !== 'approved') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-card p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <Activity className="w-12 h-12 text-primary-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Account Pending Approval</h2>
            <p className="text-gray-600 mb-6">
              Your account is currently awaiting administrator approval. You will be notified once your access has been granted.
            </p>
            <Button onClick={() => { void signIn('', ''); }} variant="secondary">
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    const dashboardRoutes = {
      admin: '/admin/dashboard',
      doctor: '/doctor/dashboard',
      lab_assistant: '/lab/dashboard',
    };
    navigate(dashboardRoutes[user.role]);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Activity className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h1 className="text-2xl font-semibold text-gray-900">ReproSight</h1>
          <p className="text-gray-600 mt-2">Clinical Risk Assessment Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

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
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Register as New User
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
