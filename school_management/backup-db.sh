#!/bin/bash
# =============================================================================
# MARSELLA - SCRIPT DE RESPALDO DE BASE DE DATOS (POSTGRESQL)
# =============================================================================
set -e

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/examdb_backup_$TIMESTAMP.sql.gz"
CONTAINER_NAME="marsella_exam_postgres"
DB_NAME="${POSTGRES_DB:-examdb}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando respaldo de la base de datos $DB_NAME..."

# Genera dump comprimido directamente desde el contenedor
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

# Mantener solo los últimos 14 días de respaldos para cuidar el espacio en disco
find "$BACKUP_DIR" -type f -name "examdb_backup_*.sql.gz" -mtime +14 -delete

echo "[$(date)] Respaldo completado exitosamente: $FILENAME"
echo "[$(date)] Tamaño del archivo: $(du -h "$FILENAME" | cut -f1)"

# Si tienes configurado un bucket de S3 con AWS CLI, descomenta la siguiente línea:
# aws s3 cp "$FILENAME" s3://nombre-de-tu-bucket-respaldos/backups/
