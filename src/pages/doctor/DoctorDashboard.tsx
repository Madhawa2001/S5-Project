import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertCircle, FileText, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Patient, PatientAssessment, Prediction } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';

interface PatientWithAssessment extends Patient {
  latestAssessment?: PatientAssessment;
  latestPrediction?: Prediction;
}

export function DoctorDashboard() {
  const [patients, setPatients] = useState<PatientWithAssessment[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithAssessment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingReviews: 0,
    highRiskPatients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(
        (p) =>
          p.patient_initials.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  async function loadDashboardData() {
    try {
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      const patientsWithData: PatientWithAssessment[] = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: assessments } = await supabase
            .from('patient_assessments')
            .select('*')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const latestAssessment = assessments?.[0];

          let latestPrediction;
          if (latestAssessment) {
            const { data: predictions } = await supabase
              .from('predictions')
              .select('*')
              .eq('assessment_id', latestAssessment.id)
              .order('prediction_date', { ascending: false })
              .limit(1);

            latestPrediction = predictions?.[0];
          }

          return {
            ...patient,
            latestAssessment,
            latestPrediction,
          };
        })
      );

      setPatients(patientsWithData);
      setFilteredPatients(patientsWithData);

      const { count: pendingCount } = await supabase
        .from('patient_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'awaiting_review');

      const highRiskCount = patientsWithData.filter((p) =>
        p.latestPrediction
          ? p.latestPrediction.infertility_risk === 'HIGH' ||
            p.latestPrediction.hormone_disorder_risk === 'HIGH' ||
            p.latestPrediction.reproductive_disorder_risk === 'HIGH' ||
            p.latestPrediction.toxicity_risk === 'HIGH'
          : false
      ).length;

      setStats({
        totalPatients: patientsWithData.length,
        pendingReviews: pendingCount || 0,
        highRiskPatients: highRiskCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getPatientStatus(patient: PatientWithAssessment): {
    text: string;
    className: string;
  } {
    if (!patient.latestAssessment) {
      return { text: 'No Assessment', className: 'bg-gray-200 text-gray-700' };
    }
    if (patient.latestAssessment.status === 'awaiting_review') {
      return { text: 'Pending Review', className: 'bg-amber-100 text-amber-800' };
    }
    if (patient.latestPrediction) {
      const hasHighRisk =
        patient.latestPrediction.infertility_risk === 'HIGH' ||
        patient.latestPrediction.hormone_disorder_risk === 'HIGH' ||
        patient.latestPrediction.reproductive_disorder_risk === 'HIGH' ||
        patient.latestPrediction.toxicity_risk === 'HIGH';

      if (hasHighRisk) {
        return { text: 'High Risk', className: 'bg-red-100 text-red-800' };
      }
    }
    return { text: 'Reviewed', className: 'bg-green-100 text-green-800' };
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
        <h1 className="text-3xl font-semibold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage patient assessments and risk profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.totalPatients}</p>
            </div>
            <Users className="w-10 h-10 text-primary-600" />
          </div>
        </Card>

        <Card className="bg-amber-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Reviews</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.pendingReviews}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Risk Patients</p>
              <p className="text-3xl font-semibold text-gray-900">{stats.highRiskPatients}</p>
            </div>
            <FileText className="w-10 h-10 text-risk-high" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient List</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by initials or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No patients found matching your search.' : 'No patients yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Patient ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Initials
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Last Assessment
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const status = getPatientStatus(patient);
                  return (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {patient.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {patient.patient_initials}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{patient.full_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {patient.latestAssessment
                          ? new Date(patient.latestAssessment.assessment_date).toLocaleDateString()
                          : 'None'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={status.className}>{status.text}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/doctor/patients/${patient.id}`}>
                          <Button size="sm" variant="primary">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
