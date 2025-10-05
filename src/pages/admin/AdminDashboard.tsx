import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingUsers: 0,
    totalPredictions: 0,
    activeUsers: { admin: 0, doctor: 0, lab_assistant: 0 },
    totalPatients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [pendingUsersRes, predictionsRes, activeUsersRes, patientsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('approval_status', 'pending'),
        supabase.from('predictions').select('id', { count: 'exact' }),
        supabase.from('users').select('role', { count: 'exact' }).eq('approval_status', 'approved'),
        supabase.from('patients').select('id', { count: 'exact' }),
      ]);

      const activeUsersByRole = {
        admin: 0,
        doctor: 0,
        lab_assistant: 0,
      };

      if (activeUsersRes.data) {
        activeUsersRes.data.forEach((user: any) => {
          activeUsersByRole[user.role as keyof typeof activeUsersByRole]++;
        });
      }

      setStats({
        pendingUsers: pendingUsersRes.count || 0,
        totalPredictions: predictionsRes.count || 0,
        activeUsers: activeUsersByRole,
        totalPatients: patientsRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-2">Manage users and monitor system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/users">
          <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-3xl font-semibold text-gray-900">{stats.pendingUsers}</p>
                {stats.pendingUsers > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle className="w-4 h-4 text-risk-high" />
                    <span className="text-sm text-risk-high">Requires attention</span>
                  </div>
                )}
              </div>
              <Users className="w-10 h-10 text-primary-600" />
            </div>
          </Card>
        </Link>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">System Usage Metrics</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.totalPredictions}</p>
              <p className="text-sm text-gray-500 mt-2">Total predictions run</p>
            </div>
            <Activity className="w-10 h-10 text-primary-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{stats.activeUsers.admin}</span> Admins
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{stats.activeUsers.doctor}</span> Doctors
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{stats.activeUsers.lab_assistant}</span> Lab Assistants
                </p>
              </div>
            </div>
            <Users className="w-10 h-10 text-primary-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Patients</h3>
          <p className="text-4xl font-semibold text-primary-600">{stats.totalPatients}</p>
          <p className="text-sm text-gray-500 mt-2">Patients in the system</p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Status</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-risk-low"></div>
            <span className="text-gray-700">ML Model Operational</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">Version 1.0</p>
        </Card>
      </div>
    </div>
  );
}
