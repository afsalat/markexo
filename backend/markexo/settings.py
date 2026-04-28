"""
Django settings for VorionMart project.
"""
from datetime import timedelta
import importlib.util
import json
from pathlib import Path
import os
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)
SYSTEM_LOG_FILE = LOG_DIR / 'system.log'
APP_CONFIG_PATH = BASE_DIR.parent / 'frontend' / 'src' / 'config' / 'appConfig.json'
LOCAL_HOST_ALIASES = ['127.0.0.1', 'localhost', '0.0.0.0']
LOCAL_DEV_FRONTEND_PORTS = [3000, 443]

def load_app_config():
    with APP_CONFIG_PATH.open(encoding='utf-8') as config_file:
        return json.load(config_file)


def parse_env_list(name):
    raw_value = os.environ.get(name, '')
    if not raw_value.strip():
        return []

    parts = []
    for chunk in raw_value.replace(';', ',').split(','):
        value = chunk.strip()
        if value:
            parts.append(value)
    return parts


def parse_bool_env(name, default=False):
    raw_value = os.environ.get(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {'1', 'true', 'yes', 'on'}


def normalize_host(value):
    parsed = urlparse(value if '://' in value else f'//{value}')
    return (parsed.hostname or value.strip()).strip().lower()


def normalize_origin(value):
    parsed = urlparse(value if '://' in value else f'https://{value}')
    if not parsed.hostname:
        return None

    protocol = parsed.scheme or 'https'
    port = parsed.port
    return build_origin(protocol, parsed.hostname.lower(), port or (443 if protocol == 'https' else 80))

def build_origin(protocol, host, port):
    origin = f"{protocol}://{host}"
    if (protocol == 'http' and port != 80) or (protocol == 'https' and port != 443):
        return f"{origin}:{port}".rstrip('/')
    return origin.rstrip('/')


def build_host_aliases(host):
    if host in set(LOCAL_HOST_ALIASES):
        return LOCAL_HOST_ALIASES
    return [host]


def build_local_dev_origins(frontend_port):
    origins = set()
    local_ports = {frontend_port, *LOCAL_DEV_FRONTEND_PORTS}

    for protocol in ('http', 'https'):
        for host in LOCAL_HOST_ALIASES:
            for port in local_ports:
                origins.add(build_origin(protocol, host, port))

    return sorted(origins)


APP_CONFIG = load_app_config()
APP_PROTOCOL = APP_CONFIG['protocol']
APP_HOST = APP_CONFIG['host']
FRONTEND_PORT = int(APP_CONFIG['frontendPort'])
BACKEND_PORT = int(APP_CONFIG['backendPort'])
HOST_ALIASES = build_host_aliases(APP_HOST)
EXTRA_ALLOWED_HOSTS = [host for host in (normalize_host(item) for item in parse_env_list('DJANGO_ALLOWED_HOSTS')) if host]
FRONTEND_ORIGINS = [build_origin(APP_PROTOCOL, host, FRONTEND_PORT) for host in HOST_ALIASES]
LOCAL_DEV_ORIGINS = build_local_dev_origins(FRONTEND_PORT)
BACKEND_ORIGIN = build_origin(APP_PROTOCOL, APP_HOST, BACKEND_PORT)
APP_URL = FRONTEND_ORIGINS[0]
HAS_WHITENOISE = importlib.util.find_spec('whitenoise') is not None

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
SECRET_KEY = 'J7s!9vK2#pL4@xN6$qR8%tU1&yW3*zC5!mB7@nD9#fG2$hJ4%kL6&pQ8'
ALLOWED_HOSTS = sorted({
    *HOST_ALIASES,
    *LOCAL_HOST_ALIASES,
    *EXTRA_ALLOWED_HOSTS,
    urlparse(APP_URL).hostname,
    urlparse(BACKEND_ORIGIN).hostname,
})

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
]

if HAS_WHITENOISE:
    MIDDLEWARE.append('whitenoise.middleware.WhiteNoiseMiddleware')

MIDDLEWARE += [
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'markexo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'markexo.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = (
    'whitenoise.storage.CompressedManifestStaticFilesStorage'
    if HAS_WHITENOISE
    else 'django.contrib.staticfiles.storage.StaticFilesStorage'
)

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
SERVE_MEDIA_FILES = DEBUG or APP_HOST in LOCAL_HOST_ALIASES

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = False
EXTRA_CORS_ALLOWED_ORIGINS = [
    origin for origin in (normalize_origin(item) for item in parse_env_list('DJANGO_CORS_ALLOWED_ORIGINS')) if origin
]
CORS_ALLOWED_ORIGINS = sorted({*FRONTEND_ORIGINS, *LOCAL_DEV_ORIGINS, *EXTRA_CORS_ALLOWED_ORIGINS})
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
DEFAULT_FROM_EMAIL = 'vorionnexustech@gmail.com'
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'vorionnexustech@gmail.com'
EMAIL_HOST_PASSWORD = 'mgnp mfix pkyo ykzw'
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_TIMEOUT = 20

USE_X_FORWARDED_HOST = False
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '').strip()
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '').strip()
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', '').strip()
TWILIO_WHATSAPP_ORDER_CONFIRMATION_CONTENT_SID = os.environ.get('TWILIO_WHATSAPP_ORDER_CONFIRMATION_CONTENT_SID', '').strip()
TWILIO_WHATSAPP_ORDER_ALERT_CONTENT_SID = os.environ.get('TWILIO_WHATSAPP_ORDER_ALERT_CONTENT_SID', '').strip()
TWILIO_WHATSAPP_STATUS_CALLBACK_URL = os.environ.get('TWILIO_WHATSAPP_STATUS_CALLBACK_URL', '').strip()
TWILIO_VALIDATE_WEBHOOK_SIGNATURE = parse_bool_env('TWILIO_VALIDATE_WEBHOOK_SIGNATURE', default=False)

# Google Merchant Center
GOOGLE_MERCHANT_ID = os.environ.get('GOOGLE_MERCHANT_ID', '').strip()
GOOGLE_SERVICE_ACCOUNT_FILE = os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE', str(BASE_DIR / 'firebase-service-account.json')).strip()


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'system_file': {
            'class': 'logging.FileHandler',
            'filename': str(SYSTEM_LOG_FILE),
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
    },
    'root': {
        'handlers': ['console', 'system_file'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'system_file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console', 'system_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'system_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'system_file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}
