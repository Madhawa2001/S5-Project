import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPlus, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/MockAuthContext';
import { PatientAssessment, Patient } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';

interface AssessmentWithPatient extends PatientAssessment {
  patient: Patient;
}

export function LabDashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithPatient[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      const { data: assessmentsData, error } = await supabase
        .from('patient_assessments')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('entered_by_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setAssessments(assessmentsData || []);

      const { count: totalCount } = await supabase
        .from('patient_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('entered_by_user_id', user.id);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: weekCount } = await supabase
        .from('patient_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('entered_by_user_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString());

      const { count: pendingCount } = await supabase
        .from('patient_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('entered_by_user_id', user.id)
        .eq('status', 'awaiting_review');

      setStats({
        total: totalCount || 0,
        thisWeek: weekCount || 0,
        pending: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
        <h1 className="text-3xl font-semibold text-gray-900">
          Welcome Back, {user?.full_name}!
        </h1>
        <Badge variant="role" role="lab_assistant" className="mt-2">
          Lab Assistant
        </Badge>
      </div>

      <div className="mb-8">
        <Link to="/lab/assessment/new">
          <Card className="hover:shadow-card-hover transition-shadow cursor-pointer bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
            <div className="flex flex-col items-center justify-center py-8">
              <ClipboardPlus className="w-16 h-16 text-primary-600 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Add New Patient Assessment
              </h2>
              <p className="text-gray-600">Enter biomarker data for a patient</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Assessments</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-primary-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">This Week</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.thisWeek}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Submissions
        </h2>
        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No assessments yet. Start by adding a new one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Patient Initials
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Assessment Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {assessment.patient.patient_initials}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(assessment.assessment_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="status" status={assessment.status}>
                        {assessment.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
