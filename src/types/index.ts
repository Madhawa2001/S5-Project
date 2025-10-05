export type UserRole = 'admin' | 'doctor' | 'lab_assistant';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type AssessmentStatus = 'draft' | 'awaiting_review' | 'reviewed';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  professional_credentials?: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface Patient {
  id: string;
  patient_initials: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  contact_phone?: string;
  contact_email?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PatientAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  hormone_lbxtes: number;
  hormone_estradiol: number;
  hormone_fsh: number;
  hormone_lh: number;
  metal_lead: number;
  metal_mercury: number;
  metal_cadmium: number;
  metal_arsenic: number;
  entered_by_user_id: string;
  reviewed_by_doctor_id?: string;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface PredictiveDriver {
  name: string;
  contribution: number;
}

export interface Prediction {
  id: string;
  assessment_id: string;
  patient_id: string;
  infertility_risk: RiskLevel;
  hormone_disorder_risk: RiskLevel;
  reproductive_disorder_risk: RiskLevel;
  toxicity_risk: RiskLevel;
  top_driver_1: PredictiveDriver;
  top_driver_2: PredictiveDriver;
  top_driver_3: PredictiveDriver;
  top_driver_4: PredictiveDriver;
  top_driver_5: PredictiveDriver;
  model_version: string;
  prediction_date: string;
  predicted_by_user_id: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  prediction_id?: string;
  doctor_id: string;
  diagnosis: string;
  care_plan: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PredictionReport {
  id: string;
  prediction_id: string;
  patient_id: string;
  report_url: string;
  generated_by_user_id: string;
  generated_at: string;
}
