-- SAARTHII Database Schema (PostgreSQL)
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM (
    'phc_staff',
    'hospital_staff',
    'medical_officer',
    'supervisor',
    'admin'
);

CREATE TYPE facility_type AS ENUM (
    'phc',
    'chc',
    'sub_district_hospital',
    'district_hospital'
);

CREATE TYPE gender_type AS ENUM (
    'male',
    'female',
    'other'
);

CREATE TYPE referral_status AS ENUM (
    'draft',
    'issued',
    'acknowledged',
    'arrived',
    'outcome_recorded',
    'back_referral_pending',
    'back_referral_completed',
    'follow_up_pending',
    'follow_up_completed',
    'closed',
    'rejected',
    'cancelled'
);

CREATE TYPE outcome_type AS ENUM (
    'treated_discharged',
    'admitted_inpatient',
    'surgery_performed',
    'stabilized_transferred_higher',
    'referred_back_outpatient',
    'patient_refused_treatment',
    'expired',
    'other'
);

CREATE TYPE task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'overdue',
    'cancelled'
);

-- 1. Facilities Table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type facility_type NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Facility Assignments (Many-to-Many)
CREATE TABLE user_facility_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_facility UNIQUE (user_id, facility_id)
);

-- 4. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_identifier VARCHAR(100) UNIQUE NOT NULL,
    abha_id VARCHAR(50),
    registering_facility_id UUID NOT NULL REFERENCES facilities(id),
    full_name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender gender_type NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Referrals Table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_number VARCHAR(100) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    referring_facility_id UUID NOT NULL REFERENCES facilities(id),
    receiving_facility_id UUID NOT NULL REFERENCES facilities(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    status referral_status DEFAULT 'draft',
    specialty_required VARCHAR(100) NOT NULL,
    referral_reason TEXT NOT NULL,
    clinical_summary TEXT NOT NULL,
    back_referral_required BOOLEAN DEFAULT TRUE,
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_due_date DATE,
    qr_token TEXT,
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Referral Events (Immutable Audit Timeline)
CREATE TABLE referral_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    performed_by_user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    from_status referral_status,
    to_status referral_status,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Referral Outcomes Table
CREATE TABLE referral_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID UNIQUE NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    recorded_by_user_id UUID NOT NULL REFERENCES users(id),
    outcome_category outcome_type NOT NULL,
    clinical_notes TEXT NOT NULL,
    recommendations TEXT,
    follow_up_date DATE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Back Referrals Table
CREATE TABLE back_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID UNIQUE NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    outcome_summary TEXT NOT NULL,
    recommended_followup_date DATE,
    acknowledged_by_phc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Follow Up Tasks Table
CREATE TABLE follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    assigned_to_user_id UUID NOT NULL REFERENCES users(id),
    assigned_by_user_id UUID NOT NULL REFERENCES users(id),
    task_description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status task_status DEFAULT 'pending',
    completion_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_referrals_referring_facility ON referrals(referring_facility_id);
CREATE INDEX idx_referrals_receiving_facility ON referrals(receiving_facility_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_patients_identifier ON patients(patient_identifier);
CREATE INDEX idx_patients_abha ON patients(abha_id);
CREATE INDEX idx_referral_events_referral ON referral_events(referral_id);
CREATE INDEX idx_follow_up_tasks_assignee ON follow_up_tasks(assigned_to_user_id);
CREATE INDEX idx_follow_up_tasks_status ON follow_up_tasks(status);
