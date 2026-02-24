#!/bin/bash
set -e

# Run migrations before starting the server
echo "Running database migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
