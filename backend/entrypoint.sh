#!/bin/sh
# Entrypoint script for Django backend container.
# Runs migrations first, then starts gunicorn.

set -e

echo "==> Running Django migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Starting Gunicorn..."
exec gunicorn markexo.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
