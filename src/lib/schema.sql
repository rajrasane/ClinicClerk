-- ClinicClerk Database Schema
-- Digital patient records management system

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(100),
    address TEXT,
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    chief_complaint TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    follow_up_date DATE,
    vitals JSONB, -- JSON format for flexible vital signs storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, allergies, emergency_contact) VALUES
('Ramesh', 'Sharma', '1975-03-15', 'Male', '+919876543210', 'ramesh.sharma@email.com', '123 MG Road, Mumbai, Maharashtra', 'B+', 'Penicillin allergy', 'Sunita Sharma - +919876543211'),
('Priya', 'Patel', '1982-07-22', 'Female', '+919876543212', 'priya.patel@email.com', '456 Brigade Road, Bangalore, Karnataka', NULL, 'None', 'Raj Patel - +919876543213'),
('Amit', 'Kumar', '1990-11-08', 'Male', '+919876543214', 'amit.kumar@email.com', '789 CP, New Delhi', 'A-', 'Dust allergy', NULL),
('Lakshmi', 'Devi', '1965-05-12', 'Female', '+919876543216', NULL, 'Village Rampur, District Sitapur', NULL, 'None', NULL)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO visits (patient_id, visit_date, chief_complaint, symptoms, diagnosis, prescription, notes, vitals) VALUES
(1, '2024-01-15', 'Fever and headache', 'High fever, severe headache, body ache', 'Viral fever', 'Paracetamol 500mg twice daily, Rest', 'Patient advised to take complete rest', '{"temperature": "102°F", "bp": "120/80", "pulse": "85", "weight": "70kg"}'),
(2, '2024-01-20', 'Routine checkup', 'No specific complaints', 'Normal health checkup', 'Vitamin D supplements', 'All vitals normal, continue healthy lifestyle', '{"temperature": "98.6°F", "bp": "110/70", "pulse": "72", "weight": "58kg"}'),
(3, '2024-01-25', 'Stomach pain', 'Abdominal pain, nausea', 'Gastritis', 'Antacid, avoid spicy food', 'Dietary changes recommended', '{"temperature": "99°F", "bp": "115/75", "pulse": "78", "weight": "65kg"}'),
(1, '2025-01-30', 'Follow-up visit', 'Feeling much better, no fever', 'Recovery from viral fever', 'Continue rest, increase fluid intake', 'Patient recovered well, advised to return if symptoms recur', '{"temperature": "98.4°F", "blood_pressure": "118/78", "pulse": "80", "weight": "71kg"}'),
(4, '2025-02-01', 'Joint pain and stiffness', 'Pain in knees and back, difficulty walking in morning', 'Arthritis - likely osteoarthritis', 'Ibuprofen 400mg twice daily, physiotherapy exercises', 'Elderly patient from village, advised gentle exercises and warm compress', '{"temperature": "98.2°F", "blood_pressure": "140/90", "pulse": "88", "weight": "55kg"}')
ON CONFLICT DO NOTHING;
