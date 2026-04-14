-- Run if your DB already had only 3 wards; adds wards 4–8
USE fixmyward;
INSERT IGNORE INTO wards (ward_name, description) VALUES
('Ward 4 - Whitefield', 'Covering Whitefield and IT corridor'),
('Ward 5 - Marathahalli', 'Covering Marathahalli and surrounding areas'),
('Ward 6 - Jayanagar', 'Covering Jayanagar blocks'),
('Ward 7 - JP Nagar', 'Covering JP Nagar phases'),
('Ward 8 - Electronic City', 'Covering Electronic City Phase 1 & 2');
