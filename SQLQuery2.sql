-- 1. Tạo database với collation tiếng Việt
CREATE DATABASE apidb
COLLATE Vietnamese_100_CI_AS;
GO

-- 2. Sử dụng database
USE apidb;
GO

-- 3. Tạo bảng Users
CREATE TABLE [User] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    hashed_password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    phone NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    emergency_contact NVARCHAR(255) NULL,
    relationship NVARCHAR(50) NULL
);

-- 4. Tạo bảng Teacher
CREATE TABLE Teacher (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    hashed_password NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    emergency_contact NVARCHAR(255) NULL,
    experience NVARCHAR(MAX) NULL,
    education_level NVARCHAR(255) NULL,
    school_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL
);

-- 5. Tạo bảng ClassRoom
CREATE TABLE ClassRoom (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    teacher_id INT NULL FOREIGN KEY REFERENCES Teacher(id) ON DELETE SET NULL,
    school_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL
);

-- 6. Tạo bảng Child
CREATE TABLE Child (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    date_of_birth DATETIME NULL,
    class_id INT NULL FOREIGN KEY REFERENCES ClassRoom(id) ON DELETE SET NULL,
    parent_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL
);

-- 7. Tạo bảng Camera
CREATE TABLE Camera (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    class_id INT NULL FOREIGN KEY REFERENCES ClassRoom(id) ON DELETE SET NULL,
    rtsp_url NVARCHAR(500) NULL,
    active BIT NOT NULL DEFAULT 1
);

-- 8. Tạo bảng DangerZone
CREATE TABLE DangerZone (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    coords_json NVARCHAR(MAX) NOT NULL,
    severity INT NOT NULL DEFAULT 1
);

-- 9. Tạo bảng Alert
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

-- 10. Tạo bảng BehaviorLog
CREATE TABLE BehaviorLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    child_id INT NOT NULL FOREIGN KEY REFERENCES Child(id) ON DELETE CASCADE,
    camera_id INT NULL FOREIGN KEY REFERENCES Camera(id) ON DELETE SET NULL,
    behavior_type NVARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT GETUTCDATE()
);

-- 11. Tạo bảng FaceRecognitionData
CREATE TABLE FaceRecognitionData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    child_id INT NULL FOREIGN KEY REFERENCES Child(id) ON DELETE SET NULL,
    encoding_path NVARCHAR(500) NOT NULL
);

-- 12. Tạo bảng AuditLog
CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL FOREIGN KEY REFERENCES [User](id) ON DELETE SET NULL,
    action NVARCHAR(100) NOT NULL,
    details NVARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);