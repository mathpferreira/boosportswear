#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BOO_BACKUP_DIR:-/var/backups/boo-sportwear}"
DB_NAME="${BOO_DB_NAME:-boo_db}"
APP_DIR="${BOO_APP_DIR:-/var/www/boosportswear}"
RETENTION_DAYS="${BOO_BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

install -d -m 0700 "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/${DB_NAME}_${STAMP}.dump"
UPLOAD_FILE="$BACKUP_DIR/uploads_${STAMP}.tar.gz"
FILES=("$DB_FILE")

runuser -u postgres -- pg_dump --format=custom --no-owner "$DB_NAME" > "${DB_FILE}.tmp"
mv "${DB_FILE}.tmp" "$DB_FILE"

if [[ -d "$APP_DIR/boo-api/uploads" ]]; then
  tar -C "$APP_DIR/boo-api" -czf "${UPLOAD_FILE}.tmp" uploads
  mv "${UPLOAD_FILE}.tmp" "$UPLOAD_FILE"
  FILES+=("$UPLOAD_FILE")
fi

sha256sum "${FILES[@]}" > "$BACKUP_DIR/checksums_${STAMP}.sha256"
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete
