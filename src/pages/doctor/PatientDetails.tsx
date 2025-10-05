import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Brain, FileDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
// import { mockSupabase as supabase } from '../../lib/mockSupabase';
import { Patient, PatientAssessment, Prediction } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';

export function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const { toasts, showToast, removeToast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<PatientAssessment[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningPrediction, setIsRunningPrediction] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  async function loadPatientData(patientId: string) {
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (patientError) throw patientError;
      setPatient(patientData);

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('patient_assessments')
        .select('*')
        .eq('patient_id', patientId)
        .order('assessment_date', { ascending: false });

      if (assessmentsError) throw assessmentsError;
      setAssessments(assessmentsData || []);

      if (assessmentsData && assessmentsData.length > 0) {
        const { data: predictionData } = await supabase
          .from('predictions')
          .select('*')
          .eq('assessment_id', assessmentsData[0].id)
          .order('prediction_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        setLatestPrediction(predictionData);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      showToast('error', 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  }

  async function runPrediction() {
    if (!assessments[0] || !patient) return;

    setIsRunningPrediction(true);

    try {
      const assessment = assessments[0];

      const mockPrediction: Omit<Prediction, 'id' | 'prediction_date'> = {
        assessment_id: assessment.id,
        patient_id: patient.id,
        infertility_risk: assessment.hormone_lbxtes < 300 ? 'HIGH' : 'LOW',
        hormone_disorder_risk: assessment.hormone_estradiol > 50 ? 'MEDIUM' : 'LOW',
        reproductive_disorder_risk: assessment.hormone_fsh > 12 ? 'HIGH' : 'LOW',
        toxicity_risk: assessment.metal_lead > 5 ? 'HIGH' : 'LOW',
        top_driver_1: { name: 'Testosterone Level', contribution: 0.35 },
        top_driver_2: { name: 'Lead Concentration', contribution: 0.25 },
        top_driver_3: { name: 'FSH Level', contribution: 0.20 },
        top_driver_4: { name: 'Mercury Level', contribution: 0.12 },
        top_driver_5: { name: 'Estradiol Level', contribution: 0.08 },
        model_version: '1.0',
        predicted_by_user_id: '',
      };

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      const { data: newPrediction, error } = await supabase
        .from('predictions')
        .insert({
          ...mockPrediction,
          predicted_by_user_id: currentUser.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setLatestPrediction(newPrediction);
      showToast('success', 'Prediction completed successfully');
    } catch (error) {
      console.error('Error running prediction:', error);
      showToast('error', 'Failed to run prediction');
    } finally {
      setIsRunningPrediction(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading patient..." />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Patient not found</p>
      </div>
    );
  }

  const latestAssessment = assessments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-6">
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">{patient.patient_initials}</h1>
          <p className="text-gray-600 mt-1">{patient.full_name}</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button
            variant="primary"
            icon={<Brain className="w-5 h-5" />}
            onClick={runPrediction}
            isLoading={isRunningPrediction}
            disabled={!latestAssessment || isRunningPrediction}
          >
            Run Prediction
          </Button>
          <Button
            variant="secondary"
            icon={<FileDown className="w-5 h-5" />}
            disabled={!latestPrediction}
          >
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">General Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-base text-gray-900">{patient.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="text-base text-gray-900 capitalize">{patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="text-base text-gray-900">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </p>
            </div>
            {patient.contact_phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base text-gray-900">{patient.contact_phone}</p>
              </div>
            )}
            {patient.contact_email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base text-gray-900">{patient.contact_email}</p>
              </div>
            )}
          </div>
        </Card>

        {latestAssessment ? (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Lab Results</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Hormone Levels</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Testosterone</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.hormone_lbxtes} ng/mL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estradiol</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.hormone_estradiol} pg/mL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FSH</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.hormone_fsh} mIU/mL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">LH</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.hormone_lh} mIU/mL
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Heavy Metal Concentrations</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lead</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.metal_lead} μg/dL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mercury</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.metal_mercury} μg/L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cadmium</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.metal_cadmium} μg/L
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Arsenic</span>
                    <span className="text-sm font-medium text-gray-900">
                      {latestAssessment.metal_arsenic} μg/L
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Assessment Date: {new Date(latestAssessment.assessment_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-gray-600 text-center py-8">No assessment data available</p>
          </Card>
        )}
      </div>

      {latestPrediction && (
        <div className="mt-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Risk Assessment Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <Badge variant="risk" riskLevel={latestPrediction.infertility_risk} className="mb-2">
                  {latestPrediction.infertility_risk} RISK
                </Badge>
                <p className="text-sm font-medium text-gray-900">Infertility Risk</p>
              </div>
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <Badge variant="risk" riskLevel={latestPrediction.hormone_disorder_risk} className="mb-2">
                  {latestPrediction.hormone_disorder_risk} RISK
                </Badge>
                <p className="text-sm font-medium text-gray-900">Hormone Disorder</p>
              </div>
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <Badge variant="risk" riskLevel={latestPrediction.reproductive_disorder_risk} className="mb-2">
                  {latestPrediction.reproductive_disorder_risk} RISK
                </Badge>
                <p className="text-sm font-medium text-gray-900">Reproductive Disorder</p>
              </div>
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <Badge variant="risk" riskLevel={latestPrediction.toxicity_risk} className="mb-2">
                  {latestPrediction.toxicity_risk} RISK
                </Badge>
                <p className="text-sm font-medium text-gray-900">Toxicity Risk</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Predictive Drivers</h3>
              <div className="space-y-3">
                {[
                  latestPrediction.top_driver_1,
                  latestPrediction.top_driver_2,
                  latestPrediction.top_driver_3,
                  latestPrediction.top_driver_4,
                  latestPrediction.top_driver_5,
                ].map((driver, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{driver.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(driver.contribution * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${driver.contribution * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
