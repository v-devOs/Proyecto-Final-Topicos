-- =============================================
-- SEED USERS FOR TESTING
-- =============================================
-- Database: proyecto_final_db
-- Password for all users: "test123"
-- 
-- IMPORTANT: These are bcrypt hashes for the password "test123"
-- You can connect to PostgreSQL and run these queries:
-- docker exec -it postgres-db psql -U admin -d proyecto_final_db
-- Then copy and paste these queries
-- =============================================

-- 1. Insert Admin User
INSERT INTO admins (
    first_name, 
    last_name, 
    email, 
    password_hash, 
    active, 
    created_at
) VALUES (
    'Admin',
    'Principal',
    'admin@clinica.com',
    '$2b$10$dQlPANHUO24pTSFoiTgah.okoHPMhrER7Vg8L7d6cfJ69LtMdRANm',
    true,
    NOW()
);

-- 2. Create a consultation room first (optional, but useful)
INSERT INTO consultation_rooms (
    code,
    name,
    location,
    capacity,
    active
) VALUES (
    'CONS-001',
    'Consultorio Principal',
    'Piso 1 - Oficina 101',
    1,
    true
);

-- 3. Insert Staff (Psychologist) User
INSERT INTO staff (
    first_name,
    last_name,
    email,
    password_hash,
    phone,
    date_of_birth,
    hire_date,
    consultation_room_id,
    active,
    created_at,
    created_by
) VALUES (
    'María',
    'Rodríguez',
    'psicologa@clinica.com',
    '$2b$10$KmUnhQ3RRX1YGSQuR6wK0OawPBQ3J29Lmc4e97t8qEmmrRotEf3Q2',
    '+503 7890-1234',
    '1990-05-15',
    CURRENT_DATE,
    1, -- References the consultation room created above
    true,
    NOW(),
    NULL -- No creator for seed data
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check inserted admin
SELECT id, first_name, last_name, email, active FROM admins WHERE email = 'admin@clinica.com';

-- Check inserted staff
SELECT id, first_name, last_name, email, phone, active FROM staff WHERE email = 'psicologa@clinica.com';

-- Check consultation room
SELECT id, code, name, location FROM consultation_rooms WHERE code = 'CONS-001';
