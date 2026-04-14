CREATE DATABASE IF NOT EXISTS fixmyward;
USE fixmyward;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE,
    name VARCHAR(100),
    role ENUM('citizen', 'ward_member', 'admin') DEFAULT 'citizen',
    is_verified BOOLEAN DEFAULT FALSE,
    ward_id INT,
    google_id VARCHAR(100),
    apple_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wards (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS ward_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT,
    user_id INT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ward_id INT,
    description TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id)
);

CREATE TABLE IF NOT EXISTS complaint_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT,
    updated_by INT,
    status ENUM('pending', 'in_progress', 'resolved'),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Initial Wards (at least 8)
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 1 - Indiranagar', 'Covering Indiranagar area');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 2 - Koramangala', 'Covering Koramangala area');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 3 - HSR Layout', 'Covering HSR Sectors 1-7');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 4 - Whitefield', 'Covering Whitefield and IT corridor');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 5 - Marathahalli', 'Covering Marathahalli and surrounding areas');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 6 - Jayanagar', 'Covering Jayanagar blocks');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 7 - JP Nagar', 'Covering JP Nagar phases');
INSERT IGNORE INTO wards (ward_name, description) VALUES ('Ward 8 - Electronic City', 'Covering Electronic City Phase 1 & 2');
