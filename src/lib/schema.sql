-- Doctors table linked to auth.users
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(30) NOT NULL,
    middle_name VARCHAR(30),
    last_name VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(10),
    clinic_name VARCHAR(100),
    clinic_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table with doctor_id
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    first_name VARCHAR(30) NOT NULL,
    middle_name VARCHAR(30),
    last_name VARCHAR(30) NOT NULL,
    age SMALLINT NOT NULL CHECK (age >= 0 AND age <= 150),
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F', 'O')),
    phone VARCHAR(10) NOT NULL,
    address VARCHAR(200),
    blood_group CHAR(3) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies VARCHAR(500),
    emergency_contact VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visits table with doctor_id
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    chief_complaint VARCHAR(300) NOT NULL,
    symptoms VARCHAR(500),
    diagnosis VARCHAR(300),
    prescription VARCHAR(1000),
    notes VARCHAR(500),
    follow_up_date DATE,
    vitals JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_doctors_phone ON doctors(phone);
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
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
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors table
-- Policy: Users can read their own doctor profile
CREATE POLICY "Users can read own doctor profile" 
ON doctors FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own doctor profile
CREATE POLICY "Users can update own doctor profile" 
ON doctors FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Users can delete their own doctor profile
CREATE POLICY "Users can delete own doctor profile" 
ON doctors FOR DELETE 
USING (auth.uid() = id);

-- Policy: Allow users to insert their own doctor profile (for signup)
CREATE POLICY "Users can insert own doctor profile" 
ON doctors FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for patients table
CREATE POLICY "Doctors can only see their own patients" ON patients
    FOR ALL USING (auth.uid() = doctor_id);

-- RLS Policies for visits table  
CREATE POLICY "Doctors can only see their own visits" ON visits
    FOR ALL USING (auth.uid() = doctor_id);

-- Additional policy to ensure visits belong to doctor's patients
CREATE POLICY "Visits must belong to doctor's patients" ON visits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = visits.patient_id 
            AND patients.doctor_id = auth.uid()
        )
    );