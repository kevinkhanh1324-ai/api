-- 1. Tạo database (không cần trong PostgreSQL — Render tự tạo)
-- => Bỏ dòng CREATE DATABASE

-- 2. Tạo bảng Package
CREATE TABLE package (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    duration_days INTEGER NOT NULL,
    camera_limit INTEGER NOT NULL,
    ai_features TEXT NOT NULL, -- JSON string
    storage_days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- 3. Tạo bảng users (đổi từ [User])
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(255),
    relationship VARCHAR(50),
    active_package_id INTEGER REFERENCES package(id) ON DELETE SET NULL,
    package_expiry_date TIMESTAMP WITHOUT TIME ZONE,
    is_active_package BOOLEAN NOT NULL DEFAULT false
);

-- 4. Tạo bảng teacher
CREATE TABLE teacher (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(255),
    experience TEXT,
    education_level VARCHAR(255),
    school_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Tạo bảng classroom
CREATE TABLE classroom (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    teacher_id INTEGER REFERENCES teacher(id) ON DELETE SET NULL,
    school_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Tạo bảng child
CREATE TABLE child (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth TIMESTAMP WITHOUT TIME ZONE,
    class_id INTEGER REFERENCES classroom(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Tạo bảng camera
CREATE TABLE camera (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class_id INTEGER REFERENCES classroom(id) ON DELETE SET NULL,
    rtsp_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT true
);

-- 8. Tạo bảng danger_zone
CREATE TABLE danger_zone (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    coords_json TEXT NOT NULL, -- JSON string
    severity INTEGER NOT NULL DEFAULT 1
);

-- 9. Tạo bảng alert
CREATE TABLE alert (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES child(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES camera(id) ON DELETE SET NULL,
    danger_zone_id INTEGER REFERENCES danger_zone(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity INTEGER NOT NULL DEFAULT 1,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- 10. Tạo bảng behavior_log
CREATE TABLE behavior_log (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES child(id) ON DELETE CASCADE,
    camera_id INTEGER REFERENCES camera(id) ON DELETE SET NULL,
    behavior_type VARCHAR(100) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- 11. Tạo bảng face_recognition_data
CREATE TABLE face_recognition_data (
    id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES child(id) ON DELETE SET NULL,
    encoding_path VARCHAR(500) NOT NULL
);

-- 12. Tạo bảng audit_log
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- 13. Tạo bảng payment
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES package(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    method VARCHAR(50) NOT NULL, -- "PayPOS", "Manual"
    status VARCHAR(50) NOT NULL, -- "Pending", "Success", "Failed"
    transaction_id VARCHAR(255) UNIQUE,
    transaction_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    expiry_date TIMESTAMP WITHOUT TIME ZONE
);