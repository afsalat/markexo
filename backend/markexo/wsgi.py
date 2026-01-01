"""
WSGI config for Markexo project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
application = get_wsgi_application()
