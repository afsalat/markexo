# VorionMart - Local Marketplace Platform

A modern e-commerce platform for local marketplace business by **Vorion Nexus Technology**.

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL (SQLite for development)

## Features

### Customer Side
- 🛍️ Product catalog with filters and search
- 🛒 Shopping cart with quantity management
- 💳 Multi-step checkout flow
- 📦 Order tracking

### Admin Dashboard
- 📊 Dashboard with revenue, orders, commission stats
- 📋 Order management with status updates
- 📦 Product management (CRUD)
- 🏪 Partner shop management
- 🖼️ Banner management
- ⚙️ Site settings

## Project Structure

```
VorionMart/
├── backend/           # Django Backend
│   ├── VorionMart/       # Django project settings
│   ├── api/           # REST API app
│   └── manage.py
│
└── frontend/          # Next.js Frontend
    ├── src/
    │   ├── app/       # Pages (App Router)
    │   ├── components/# React components
    │   └── lib/       # Utilities & API
    └── package.json
```

## Getting Started

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create `.env` file in backend folder:
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_ENGINE=django.db.backends.mysql
DB_NAME=VorionMart
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=3306
```

Create `.env.local` file in frontend folder:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## URLs

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Django Admin**: http://localhost:8000/admin
- **API**: http://localhost:8000/api

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/products/` | List products |
| `GET /api/products/{slug}/` | Product detail |
| `GET /api/categories/` | List categories |
| `GET /api/shops/` | List shops |
| `POST /api/orders/create/` | Create order |
| `GET /api/admin/stats/` | Dashboard stats |

## License

© 2024 Vorion Nexus Technology. All rights reserved.
