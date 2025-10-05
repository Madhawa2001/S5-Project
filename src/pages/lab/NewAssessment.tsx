import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Gender } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';

interface FormData {
  patientId: string | null;
  patientInitials: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  contactPhone: string;
  contactEmail: string;
  hormoneLbxtes: string;
  hormoneEstradiol: string;
  hormoneFsh: string;
  hormoneLh: string;
  metalLead: string;
  metalMercury: string;
  metalCadmium: string;
  metalArsenic: string;
}

export function NewAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    patientId: null,
    patientInitials: '',
    fullName: '',
    gender: 'male',
    dateOfBirth: '',
    contactPhone: '',
    contactEmail: '',
    hormoneLbxtes: '',
    hormoneEstradiol: '',
    hormoneFsh: '',
    hormoneLh: '',
    metalLead: '',
    metalMercury: '',
    metalCadmium: '',
    metalArsenic: '',
  });

  const steps = [
    { number: 1, title: 'Patient Info' },
    { number: 2, title: 'Hormone Levels' },
    { number: 3, title: 'Heavy Metals' },
    { number: 4, title: 'Review' },
  ];

  function updateFormData(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep(step: number): boolean {
    if (step === 1) {
      return !!(
        formData.patientInitials &&
        formData.fullName &&
        formData.dateOfBirth
      );
    }
    if (step === 2) {
      return !!(
        formData.hormoneLbxtes &&
        formData.hormoneEstradiol &&
        formData.hormoneFsh &&
        formData.hormoneLh
      );
    }
    if (step === 3) {
      return !!(
        formData.metalLead &&
        formData.metalMercury &&
        formData.metalCadmium &&
        formData.metalArsenic
      );
    }
    return true;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      showToast('error', 'Please fill in all required fields');
    }
  }

  function prevStep() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    if (!user) return;

    setIsSubmitting(true);

    try {
      let patientId = formData.patientId;

      if (!patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            patient_initials: formData.patientInitials,
            full_name: formData.fullName,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            created_by_user_id: user.id,
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      const { error: assessmentError } = await supabase
        .from('patient_assessments')
        .insert({
          patient_id: patientId,
          hormone_lbxtes: parseFloat(formData.hormoneLbxtes),
          hormone_estradiol: parseFloat(formData.hormoneEstradiol),
          hormone_fsh: parseFloat(formData.hormoneFsh),
          hormone_lh: parseFloat(formData.hormoneLh),
          metal_lead: parseFloat(formData.metalLead),
          metal_mercury: parseFloat(formData.metalMercury),
          metal_cadmium: parseFloat(formData.metalCadmium),
          metal_arsenic: parseFloat(formData.metalArsenic),
          entered_by_user_id: user.id,
          status: 'awaiting_review',
        });

      if (assessmentError) throw assessmentError;

      showToast('success', 'Assessment submitted successfully!');
      setTimeout(() => {
        navigate('/lab/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      showToast('error', 'Failed to submit assessment');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">New Patient Assessment</h1>
        <p className="text-gray-600 mt-2">Enter biomarker data for reproductive health assessment</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <p className="text-xs mt-2 text-gray-600">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Patient Initials *"
                value={formData.patientInitials}
                onChange={(e) => updateFormData('patientInitials', e.target.value)}
                placeholder="ABC"
                maxLength={4}
                helperText="Enter 3-4 character initials"
              />
              <Input
                label="Full Name *"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                placeholder="Enter patient's full name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Date of Birth *"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
              />
              <Input
                label="Contact Phone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateFormData('contactPhone', e.target.value)}
                placeholder="(123) 456-7890"
              />
              <Input
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormData('contactEmail', e.target.value)}
                placeholder="patient@example.com"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hormone Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Testosterone (ng/mL) *"
                type="number"
                step="0.01"
                value={formData.hormoneLbxtes}
                onChange={(e) => updateFormData('hormoneLbxtes', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: 300-1000 ng/mL"
              />
              <Input
                label="Estradiol (pg/mL) *"
                type="number"
                step="0.01"
                value={formData.hormoneEstradiol}
                onChange={(e) => updateFormData('hormoneEstradiol', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: 10-50 pg/mL"
              />
              <Input
                label="FSH (mIU/mL) *"
                type="number"
                step="0.01"
                value={formData.hormoneFsh}
                onChange={(e) => updateFormData('hormoneFsh', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: 1-12 mIU/mL"
              />
              <Input
                label="LH (mIU/mL) *"
                type="number"
                step="0.01"
                value={formData.hormoneLh}
                onChange={(e) => updateFormData('hormoneLh', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: 1-9 mIU/mL"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Heavy Metal Concentrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lead (μg/dL) *"
                type="number"
                step="0.01"
                value={formData.metalLead}
                onChange={(e) => updateFormData('metalLead', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: < 5 μg/dL"
              />
              <Input
                label="Mercury (μg/L) *"
                type="number"
                step="0.01"
                value={formData.metalMercury}
                onChange={(e) => updateFormData('metalMercury', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: < 10 μg/L"
              />
              <Input
                label="Cadmium (μg/L) *"
                type="number"
                step="0.01"
                value={formData.metalCadmium}
                onChange={(e) => updateFormData('metalCadmium', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: < 5 μg/L"
              />
              <Input
                label="Arsenic (μg/L) *"
                type="number"
                step="0.01"
                value={formData.metalArsenic}
                onChange={(e) => updateFormData('metalArsenic', e.target.value)}
                placeholder="0.00"
                helperText="Reference range: < 10 μg/L"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Assessment</h2>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p className="text-sm"><span className="font-medium">Initials:</span> {formData.patientInitials}</p>
                <p className="text-sm"><span className="font-medium">Name:</span> {formData.fullName}</p>
                <p className="text-sm"><span className="font-medium">Gender:</span> {formData.gender}</p>
                <p className="text-sm"><span className="font-medium">DOB:</span> {formData.dateOfBirth}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Hormone Levels</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p className="text-sm"><span className="font-medium">Testosterone:</span> {formData.hormoneLbxtes} ng/mL</p>
                <p className="text-sm"><span className="font-medium">Estradiol:</span> {formData.hormoneEstradiol} pg/mL</p>
                <p className="text-sm"><span className="font-medium">FSH:</span> {formData.hormoneFsh} mIU/mL</p>
                <p className="text-sm"><span className="font-medium">LH:</span> {formData.hormoneLh} mIU/mL</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Heavy Metal Concentrations</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p className="text-sm"><span className="font-medium">Lead:</span> {formData.metalLead} μg/dL</p>
                <p className="text-sm"><span className="font-medium">Mercury:</span> {formData.metalMercury} μg/L</p>
                <p className="text-sm"><span className="font-medium">Cadmium:</span> {formData.metalCadmium} μg/L</p>
                <p className="text-sm"><span className="font-medium">Arsenic:</span> {formData.metalArsenic} μg/L</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
            icon={<ChevronLeft className="w-5 h-5" />}
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              icon={<ChevronRight className="w-5 h-5" />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={<Save className="w-5 h-5" />}
            >
              Submit for Review
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
