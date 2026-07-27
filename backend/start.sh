#!/bin/bash
set -e

echo "🚀 RevFlow AI — Production Startup"
echo "==================================="

# Run database migrations before starting the server
echo "📦 Running Alembic database migrations..."
/root/.local/bin/alembic upgrade head
echo "✅ Migrations complete."

# Start uvicorn with production settings
echo "🌐 Starting FastAPI server..."
exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers "${WORKERS:-2}" \
  --log-level "${LOG_LEVEL:-info}"
