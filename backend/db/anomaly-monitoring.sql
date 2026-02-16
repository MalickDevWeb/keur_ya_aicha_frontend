-- Query to monitor anomalies in the AuditLogs table
-- Detect failed login attempts
SELECT user_id, COUNT(*) AS failed_attempts
FROM AuditLogs
WHERE action = 'FAILED_LOGIN'
AND timestamp > NOW() - INTERVAL '1 HOUR'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- Detect unusual activity (e.g., multiple actions from the same IP)
SELECT ip_address, COUNT(*) AS action_count
FROM AuditLogs
WHERE timestamp > NOW() - INTERVAL '1 HOUR'
GROUP BY ip_address
HAVING COUNT(*) > 100;
