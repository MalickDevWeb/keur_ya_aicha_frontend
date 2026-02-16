-- Create the OTP table to store one-time passwords for secure actions
CREATE TABLE OTP (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    action VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Index for faster querying unused OTPs
CREATE INDEX idx_otp_is_used ON OTP(is_used);
CREATE INDEX idx_otp_expires_at ON OTP(expires_at);
