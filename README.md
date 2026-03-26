# Markexo

Marketplace application with a Django API (`backend/`) and a Next.js storefront/admin (`frontend/`).

## Stack

- Backend: Django 4.2, Django REST Framework, MySQL or SQLite
- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS

## Development

Shared host and port settings are hardcoded in [appConfig.json](/c:/Users/USER/Desktop/markexo/frontend/src/config/appConfig.json). Update that file if you want to change the frontend or backend port. The frontend scripts and Django `runserver` now read from that file automatically.

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

Backend runtime host and port values are read from [appConfig.json](/c:/Users/USER/Desktop/markexo/frontend/src/config/appConfig.json), with the rest of the backend settings defined in [settings.py](/c:/Users/USER/Desktop/markexo/backend/markexo/settings.py).

This project is configured to use SQLite by default:

- Database file: `backend/db.sqlite3`
- Hosts and origins are derived from `frontend/src/config/appConfig.json`
- SMTP settings are set in `settings.py`

### Frontend

Frontend URLs are derived from [appConfig.json](/c:/Users/USER/Desktop/markexo/frontend/src/config/appConfig.json) through [siteConfig.ts](/c:/Users/USER/Desktop/markexo/frontend/src/config/siteConfig.ts) and [next.config.js](/c:/Users/USER/Desktop/markexo/frontend/next.config.js).

This project is configured to use:

- App URL: `http://127.0.0.1:3000`
- API URL: `http://127.0.0.1:8000/api`
- Media URL: `http://127.0.0.1:8000/media`

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
