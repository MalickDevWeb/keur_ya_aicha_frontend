#!/bin/bash
# Script to archive and back up AuditLogs

BACKUP_DIR="/home/pmt/KeurYaAicha/kya/frontend/db/backups"
mkdir -p "$BACKUP_DIR"

# Archive logs older than 30 days
ARCHIVE_FILE="$BACKUP_DIR/auditlogs_$(date +%Y%m%d).sql"
echo "Archiving logs older than 30 days to $ARCHIVE_FILE"
psql -U postgres -d your_database_name -c "COPY (SELECT * FROM AuditLogs WHERE timestamp < NOW() - INTERVAL '30 DAYS') TO STDOUT" > "$ARCHIVE_FILE"

# Delete archived logs
echo "Deleting archived logs"
psql -U postgres -d your_database_name -c "DELETE FROM AuditLogs WHERE timestamp < NOW() - INTERVAL '30 DAYS';"

# Notify completion
echo "Backup and archive completed."
