/*
  # ReproSight Clinical Platform Database Schema
  
  ## Overview
  Creates the complete database structure for the ReproSight reproductive health risk assessment platform.
  
  ## Tables Created
  
  ### 1. users
  Stores all platform users (admins, doctors, lab assistants)
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `full_name` (text) - User's full name
  - `role` (enum) - User role: admin, doctor, or lab_assistant
  - `approval_status` (enum) - Account status: pending, approved, or rejected
  - `professional_credentials` (text) - Professional qualifications and credentials
  - `created_at` (timestamptz) - Account creation timestamp
  - `approved_by` (uuid, foreign key) - ID of admin who approved the account
  - `approved_at` (timestamptz) - Approval timestamp
  
  ### 2. patients
  Stores patient demographic information
  - `id` (uuid, primary key) - Unique patient identifier
  - `patient_initials` (text) - 3-4 character patient initials for privacy
  - `full_name` (text) - Patient's full name
  - `gender` (enum) - male, female, or other
  - `date_of_birth` (date) - Patient date of birth
  - `contact_phone` (text) - Contact phone number
  - `contact_email` (text) - Contact email address
  - `created_by_user_id` (uuid, foreign key) - ID of user who created the record
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. patient_assessments
  Stores biomarker data for reproductive health assessments
  - `id` (uuid, primary key) - Unique assessment identifier
  - `patient_id` (uuid, foreign key) - Reference to patient
  - `assessment_date` (date) - Date of assessment
  - Hormone levels (decimal): `hormone_lbxtes`, `hormone_estradiol`, `hormone_fsh`, `hormone_lh`
  - Heavy metal concentrations (decimal): `metal_lead`, `metal_mercury`, `metal_cadmium`, `metal_arsenic`
  - `entered_by_user_id` (uuid, foreign key) - Lab assistant who entered the data
  - `reviewed_by_doctor_id` (uuid, foreign key) - Doctor who reviewed the assessment
  - `status` (enum) - draft, awaiting_review, or reviewed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. predictions
  Stores ML model prediction results for risk assessments
  - `id` (uuid, primary key) - Unique prediction identifier
  - `assessment_id` (uuid, foreign key) - Reference to assessed data
  - `patient_id` (uuid, foreign key) - Reference to patient
  - Risk classifications: `infertility_risk`, `hormone_disorder_risk`, `reproductive_disorder_risk`, `toxicity_risk`
  - Top 5 predictive drivers (jsonb): Each stores {name, contribution}
  - `model_version` (text) - Version of ML model used
  - `prediction_date` (timestamptz) - When prediction was generated
  - `predicted_by_user_id` (uuid, foreign key) - Doctor who ran the prediction
  
  ### 5. clinical_notes
  Stores doctor's clinical documentation
  - `id` (uuid, primary key) - Unique note identifier
  - `patient_id` (uuid, foreign key) - Reference to patient
  - `prediction_id` (uuid, foreign key) - Reference to related prediction
  - `doctor_id` (uuid, foreign key) - Doctor who wrote the notes
  - `diagnosis` (text) - Clinical diagnosis
  - `care_plan` (text) - Recommended care plan
  - `notes` (text) - Additional clinical observations
  - `created_at` (timestamptz) - Note creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 6. prediction_reports
  Tracks generated PDF reports
  - `id` (uuid, primary key) - Unique report identifier
  - `prediction_id` (uuid, foreign key) - Reference to prediction
  - `patient_id` (uuid, foreign key) - Reference to patient
  - `report_url` (text) - URL or path to PDF report
  - `generated_by_user_id` (uuid, foreign key) - User who generated the report
  - `generated_at` (timestamptz) - Report generation timestamp
  
  ## Security
  
  - Row Level Security (RLS) is enabled on all tables
  - Policies enforce role-based access control
  - Users can only access data they are authorized to view based on their role
  - Admins have broad access for user management
  - Doctors can access their patients' data
  - Lab assistants can access assessments they entered
  
  ## Indexes
  
  - Foreign keys are indexed for optimal query performance
  - Frequently queried fields (patient_id, status, assessment_date) are indexed
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'lab_assistant');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE assessment_status AS ENUM ('draft', 'awaiting_review', 'reviewed');
CREATE TYPE risk_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  professional_credentials text,
  created_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_initials text NOT NULL,
  full_name text NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth date NOT NULL,
  contact_phone text,
  contact_email text,
  created_by_user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Patient assessments table
CREATE TABLE IF NOT EXISTS patient_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  hormone_lbxtes decimal NOT NULL,
  hormone_estradiol decimal NOT NULL,
  hormone_fsh decimal NOT NULL,
  hormone_lh decimal NOT NULL,
  metal_lead decimal NOT NULL,
  metal_mercury decimal NOT NULL,
  metal_cadmium decimal NOT NULL,
  metal_arsenic decimal NOT NULL,
  entered_by_user_id uuid REFERENCES users(id) NOT NULL,
  reviewed_by_doctor_id uuid REFERENCES users(id),
  status assessment_status NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES patient_assessments(id) NOT NULL,
  patient_id uuid REFERENCES patients(id) NOT NULL,
  infertility_risk risk_level NOT NULL,
  hormone_disorder_risk risk_level NOT NULL,
  reproductive_disorder_risk risk_level NOT NULL,
  toxicity_risk risk_level NOT NULL,
  top_driver_1 jsonb NOT NULL,
  top_driver_2 jsonb NOT NULL,
  top_driver_3 jsonb NOT NULL,
  top_driver_4 jsonb NOT NULL,
  top_driver_5 jsonb NOT NULL,
  model_version text NOT NULL DEFAULT '1.0',
  prediction_date timestamptz DEFAULT now(),
  predicted_by_user_id uuid REFERENCES users(id) NOT NULL
);

-- Clinical notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  prediction_id uuid REFERENCES predictions(id),
  doctor_id uuid REFERENCES users(id) NOT NULL,
  diagnosis text NOT NULL DEFAULT '',
  care_plan text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prediction reports table
CREATE TABLE IF NOT EXISTS prediction_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid REFERENCES predictions(id) NOT NULL,
  patient_id uuid REFERENCES patients(id) NOT NULL,
  report_url text NOT NULL,
  generated_by_user_id uuid REFERENCES users(id) NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_patient ON patient_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON patient_assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON patient_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_predictions_patient ON predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_assessment ON predictions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND approval_status = 'approved'
    )
  );

-- RLS Policies for patients table
CREATE POLICY "Doctors and lab assistants can view patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('doctor', 'lab_assistant')
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Doctors and lab assistants can create patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('doctor', 'lab_assistant')
      AND approval_status = 'approved'
    )
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "Doctors can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

-- RLS Policies for patient_assessments table
CREATE POLICY "Lab assistants can view their assessments"
  ON patient_assessments FOR SELECT
  TO authenticated
  USING (
    entered_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Lab assistants can create assessments"
  ON patient_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'lab_assistant'
      AND approval_status = 'approved'
    )
    AND entered_by_user_id = auth.uid()
  );

CREATE POLICY "Lab assistants can update their draft assessments"
  ON patient_assessments FOR UPDATE
  TO authenticated
  USING (
    entered_by_user_id = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Doctors can update assessments"
  ON patient_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

-- RLS Policies for predictions table
CREATE POLICY "Doctors can view predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Doctors can create predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
    AND predicted_by_user_id = auth.uid()
  );

-- RLS Policies for clinical_notes table
CREATE POLICY "Doctors can view clinical notes"
  ON clinical_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Doctors can create clinical notes"
  ON clinical_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
    AND doctor_id = auth.uid()
  );

CREATE POLICY "Doctors can update their clinical notes"
  ON clinical_notes FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid());

-- RLS Policies for prediction_reports table
CREATE POLICY "Doctors can view reports"
  ON prediction_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Doctors can create reports"
  ON prediction_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'doctor'
      AND approval_status = 'approved'
    )
    AND generated_by_user_id = auth.uid()
  );
