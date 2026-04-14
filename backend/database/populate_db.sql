-- Sample Data for Fix My Ward

USE fixmyward;

-- 1. Insert Wards (8+)
INSERT IGNORE INTO wards (ward_name, description) VALUES 
('Ward 1 - Indiranagar', 'Covering Indiranagar Phase 1 & 2'),
('Ward 2 - Koramangala', 'Covering Koramangala 1st to 8th Block'),
('Ward 3 - HSR Layout', 'Covering HSR Sectors 1-7'),
('Ward 4 - Whitefield', 'Covering Whitefield and IT corridor'),
('Ward 5 - Marathahalli', 'Covering Marathahalli and surrounding areas'),
('Ward 6 - Jayanagar', 'Covering Jayanagar blocks'),
('Ward 7 - JP Nagar', 'Covering JP Nagar phases'),
('Ward 8 - Electronic City', 'Covering Electronic City Phase 1 & 2');

-- 2. Insert Users (Admin, Councillors, Citizens)
-- Admin
INSERT IGNORE INTO users (phone, email, name, role, is_verified) VALUES 
('9000000001', 'admin@fixmyward.com', 'System Admin', 'admin', TRUE);

-- Councillors (Pending Verification)
INSERT IGNORE INTO users (phone, email, name, role, is_verified) VALUES 
('9000000002', 'councillor1@ward.in', 'John Councillor', 'ward_member', FALSE),
('9000000003', 'councillor2@ward.in', 'Jane Councillor', 'ward_member', FALSE);

-- Citizens
INSERT IGNORE INTO users (phone, email, name, role, is_verified) VALUES 
('9000000004', 'citizen1@test.com', 'Amit Kumar', 'citizen', TRUE),
('9000000005', 'citizen2@test.com', 'Priya Singh', 'citizen', TRUE);

-- Password login demo (username: demo, password: demo123) — requires username/password columns
INSERT IGNORE INTO users (username, password_hash, phone, email, name, role, is_verified, ward_id) VALUES 
('demo', '$2b$10$u6Z6I61s3/m8HPR.fGV5.ea2p8oVIqI0voD7i5vfoJfDC4ic/kEa2', '9000000010', 'demo@fixmyward.com', 'Demo Citizen', 'citizen', TRUE, 1);

-- 3. Mock Ward Assignments (For verified councillors)
-- Let's verify John manually for Ward 1
UPDATE users SET is_verified = TRUE, ward_id = 1 WHERE phone = '9000000002';
INSERT IGNORE INTO ward_assignments (ward_id, user_id, start_date) VALUES (1, 2, '2026-01-01');

-- 4. Sample Complaints
INSERT IGNORE INTO complaints (user_id, ward_id, description, status, latitude, longitude, image_url) VALUES 
(4, 1, 'Large pothole at Indiranagar 100ft road intersection', 'pending', 12.9716, 77.5946, '/uploads/sample1.jpg'),
(5, 1, 'Street lights are not working for the past 3 days in Ward 1', 'in_progress', 12.9730, 77.5950, '/uploads/sample2.jpg');

-- 5. Complaint History
INSERT IGNORE INTO complaint_history (complaint_id, updated_by, status, comment) VALUES 
(2, 2, 'in_progress', 'Technician assigned to check the lights.');
