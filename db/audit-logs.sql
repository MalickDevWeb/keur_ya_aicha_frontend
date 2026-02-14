-- Create the AuditLogs table to track critical actions
CREATE TABLE AuditLogs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Index for faster querying by timestamp
CREATE INDEX idx_auditlogs_timestamp ON AuditLogs(timestamp);

-- Index for faster querying by user_id
CREATE INDEX idx_auditlogs_user_id ON AuditLogs(user_id);
