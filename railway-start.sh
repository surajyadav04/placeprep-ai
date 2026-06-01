#!/bin/bash
set -e

echo "Starting Railway Deployment Initialization..."

# 1. Setup persistent directories in the mounted volume
mkdir -p /data/uploads/resources
mkdir -p /data/tmp/resumes

# 2. Seed the database on first run
if [ ! -f /data/placeprep.db ]; then
  echo "First deploy: Seeding database to volume..."
  cp backend/placeprep.db /data/placeprep.db
fi

# 3. Create symlinks so the app uses the persistent volume
rm -f backend/placeprep.db
ln -sf /data/placeprep.db backend/placeprep.db

rm -rf backend/uploads
ln -sfn /data/uploads backend/uploads

rm -rf backend/tmp
ln -sfn /data/tmp backend/tmp

echo "Persistent storage linked successfully."

# 4. Move into backend and start the application
cd backend
echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT