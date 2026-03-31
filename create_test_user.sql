-- SQL script to create default user manually
-- Email: HR@gmail
-- Name: HR
-- Password: qwerty

USE inventory_db;

-- Insert default user if it doesn't exist
INSERT INTO users (name, email, password, role_id)
SELECT 'HR', 'HR@gmail', 'qwerty', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'HR@gmail'
);

SELECT 'Default user created/verified: HR (HR@gmail / qwerty)' AS Status;

