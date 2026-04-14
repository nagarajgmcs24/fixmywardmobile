-- Run once if your database was created before username/password columns existed
USE fixmyward;
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
