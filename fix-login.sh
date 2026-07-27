#!/bin/bash
# Run this from the rev-flow root directory to fix the login issue
echo "🔧 Applying database migration to fix login..."
cd "$(dirname "$0")/backend"
../venv/bin/alembic upgrade head
echo "✅ Done! Now restart your uvicorn server and try logging in again."
