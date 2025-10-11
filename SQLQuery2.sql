-- 1. Tạo database
CREATE DATABASE apidb;
GO

-- 2. Sử dụng database
USE apidb;
GO

-- 3. Tạo bảng Users (ĐÃ THÊM CÁC CỘT MỚI)
CREATE TABLE [User] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    hashed_password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    phone NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    emergency_contact NVARCHAR(255) NULL,
    experience NVARCHAR(MAX) NULL,
    relationship NVARCHAR(50) NULL,
    education_level NVARCHAR(255) NULL
);

-- 4. Tạo bảng ClassRoom (THÊM teacher_id)
CREATE TABLE ClassRoom (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    teacher_id INT NULL FOREIGN KEY REFERENCES [User](id)
);

-- 5. Tạo bảng Child (ĐÃ THÊM date_of_birth)
CREATE TABLE Child (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    date_of_birth DATETIME NULL,
    class_id INT NULL FOREIGN KEY REFERENCES ClassRoom(id) ON DELETE SET NULL,
    parent_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL
);

-- 6. Tạo bảng Camera
CREATE TABLE Camera (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    class_id INT NULL FOREIGN KEY REFERENCES ClassRoom(id) ON DELETE SET NULL,
    rtsp_url NVARCHAR(500) NULL,
    active BIT NOT NULL DEFAULT 1
);

-- 7. Tạo bảng DangerZone
CREATE TABLE DangerZone (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    coords_json NVARCHAR(MAX) NOT NULL,
    severity INT NOT NULL DEFAULT 1
);

-- 8. Tạo bảng Alert
CREATE TABLE Alert (
    id INT IDENTITY(1,1) PRIMARY KEY,
    child_id INT NOT NULL FOREIGN KEY REFERENCES Child(id) ON DELETE CASCADE,
    camera_id INT NULL FOREIGN KEY REFERENCES Camera(id) ON DELETE SET NULL,
    danger_zone_id INT NULL FOREIGN KEY REFERENCES DangerZone(id) ON DELETE SET NULL,
    alert_type NVARCHAR(100) NOT NULL,
    severity INT NOT NULL DEFAULT 1,
    acknowledged BIT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);

-- 9. Tạo bảng BehaviorLog
CREATE TABLE BehaviorLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    child_id INT NOT NULL FOREIGN KEY REFERENCES Child(id) ON DELETE CASCADE,
    camera_id INT NULL FOREIGN KEY REFERENCES Camera(id) ON DELETE SET NULL,
    behavior_type NVARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT GETUTCDATE()
);

-- 10. Tạo bảng FaceRecognitionData
CREATE TABLE FaceRecognitionData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    child_id INT NULL FOREIGN KEY REFERENCES Child(id) ON DELETE SET NULL,
    encoding_path NVARCHAR(500) NOT NULL
);

-- 11. Tạo bảng AuditLog
CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL,
    action NVARCHAR(100) NOT NULL,
    details NVARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);