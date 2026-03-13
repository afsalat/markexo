# Markexo

Marketplace application with a Django API (`backend/`) and a Next.js storefront/admin (`frontend/`).

## Stack

- Backend: Django 4.2, Django REST Framework, MySQL or SQLite
- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS

## Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Production Environment

### Backend

Use [backend/.env.example](/c:/Users/USER/Desktop/markexo/backend/.env.example) as the template for [backend/.env](/c:/Users/USER/Desktop/markexo/backend/.env).

Required settings:

- `SECRET_KEY`
- `ALLOWED_HOSTS`
- Database settings when not using SQLite

Important optional settings:

- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `SERVE_MEDIA_FILES`
- Email SMTP settings

### Frontend

Use [frontend/.env.production.example](/c:/Users/USER/Desktop/markexo/frontend/.env.production.example) as the template for your production env file.

Required settings:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

Optional:

- `NEXT_PUBLIC_MEDIA_URL`

## Production Deploy Steps

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn markexo.wsgi:application --bind 0.0.0.0:8000
```

Notes:

- Static files are served by WhiteNoise.
- Media files should be served by your reverse proxy or object storage. Set `SERVE_MEDIA_FILES=True` only if you intentionally want Django to serve `/media/`.
- If Django runs behind Nginx, Caddy, a load balancer, or a platform proxy, keep `USE_SECURE_PROXY_SSL_HEADER=True`.

### Frontend

```bash
cd frontend
npm install
npm run build
npm run start
```

Notes:

- Next.js is configured with `output: "standalone"` for production-friendly deployment.
- Remote image hosts are derived from the configured app, API, and media URLs.

## Checks

Backend:

```bash
cd backend
python manage.py check --deploy
```

Frontend:

```bash
cd frontend
npm run build
```
