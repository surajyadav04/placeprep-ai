#!/bin/bash
set -e

echo "Starting Railway Deployment Initialization..."

# 1. Setup persistent directories in the mounted volume
mkdir -p /data/uploads/resources
mkdir -p /data/tmp/resumes

# 2. Seed the database on first run
if [ ! -f /data/placeprep.db ]; then
  echo "First deploy: Seeding database to volume..."
  cp placeprep.db /data/placeprep.db
fi

# 3. Create symlinks so the app uses the persistent volume
rm -f placeprep.db
ln -sf /data/placeprep.db placeprep.db

rm -rf uploads
ln -sfn /data/uploads uploads

rm -rf tmp
ln -sfn /data/tmp tmp

echo "Persistent storage linked successfully."

# 4. Start the application
echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT