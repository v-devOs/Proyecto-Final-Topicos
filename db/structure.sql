-- =============================================
-- PSYCHOLOGY STAFF MANAGEMENT SYSTEM
-- =============================================

-- Drop existing tables (in correct dependency order)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS consultation_rooms CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;

-- Table for specialties
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Table for consultation rooms
CREATE TABLE consultation_rooms (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE
);

-- Table for administrators
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Table for staff (psychologists)
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE DEFAULT CURRENT_DATE,
    specialty_id INTEGER REFERENCES specialties(id),
    consultation_room_id INTEGER REFERENCES consultation_rooms(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admins(id)
);

-- Table for patients (only email is stored, other data from external API)
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    registered_date DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE,
    assigned_psychologist INTEGER REFERENCES staff(id)
);

-- Table for staff schedules
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    UNIQUE(staff_id, day_of_week, start_time)
);

-- Table for appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    consultation_type VARCHAR(50),
    notes TEXT,
    consultation_room_id INTEGER REFERENCES consultation_rooms(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    UNIQUE(staff_id, appointment_date, start_time)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for email searches
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_patients_email ON patients(email);

-- Indexes for appointment searches
CREATE INDEX idx_appointments_staff_date ON appointments(staff_id, appointment_date);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_staff_status ON appointments(staff_id, status);

-- Indexes for schedules
CREATE INDEX idx_schedules_staff ON schedules(staff_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);

-- Indexes for staff
CREATE INDEX idx_staff_specialty ON staff(specialty_id);
CREATE INDEX idx_staff_consultation_room ON staff(consultation_room_id);
CREATE INDEX idx_staff_active ON staff(active);

-- Index for patient assignments
CREATE INDEX idx_patients_psychologist ON patients(assigned_psychologist);
CREATE INDEX idx_patients_active ON patients(active);