-- SAARTHII Seed Data (PostgreSQL)

-- 1. Insert Facilities
INSERT INTO facilities (id, code, name, type, address, district, state) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PHC-RMP-01', 'Primary Health Centre Rampur', 'phc', 'Main Road, Rampur Block', 'Bareilly', 'Uttar Pradesh'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'DH-BLY-02', 'District Hospital Bareilly', 'district_hospital', 'Civil Lines, Bareilly', 'Bareilly', 'Uttar Pradesh'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'SDH-AON-03', 'Sub-District Hospital Aonla', 'sub_district_hospital', 'Station Road, Aonla', 'Bareilly', 'Uttar Pradesh');

-- 2. Insert Users (Password hashes are bcrypt for 'Password123!')
INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'priya.sharma@saarthii.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK', 'Dr. Priya Sharma', '9876543210', 'phc_staff'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'ravi.kumar@saarthii.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK', 'Ravi Kumar', '9876543211', 'hospital_staff'),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'anjali.reddy@saarthii.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK', 'Dr. Anjali Reddy', '9876543212', 'supervisor'),
('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'admin@saarthii.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i.eK', 'System Administrator', '9876543213', 'admin');

-- 3. Insert User Facility Assignments
INSERT INTO user_facility_assignments (user_id, facility_id, is_primary) VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', TRUE),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', TRUE),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', TRUE);

-- 4. Insert Sample Patients
INSERT INTO patients (id, patient_identifier, abha_id, registering_facility_id, full_name, dob, gender, phone, address) VALUES
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'PAT-2026-0001', '14-9928-1102-4412', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rahul Kumar', '1985-06-12', 'male', '9123456780', 'Village Rampur, Post Rampur'),
('22eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'PAT-2026-0002', '14-9928-1102-4413', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sunita Devi', '1992-03-24', 'female', '9123456781', 'Village Piparia, Rampur');
