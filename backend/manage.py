#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import json
import os
import sys
from pathlib import Path


APP_CONFIG_PATH = Path(__file__).resolve().parent.parent / 'frontend' / 'src' / 'config' / 'appConfig.json'
LOCAL_RUNSERVER_HOST = '127.0.0.1'
LOCAL_RUNSERVER_PORT = 8000


def is_local_bind_host(host):
    return host in {'127.0.0.1', 'localhost', '0.0.0.0', '::1', '::'}


def apply_default_runserver_address():
    if len(sys.argv) != 2 or sys.argv[1] != 'runserver':
        return

    with APP_CONFIG_PATH.open(encoding='utf-8') as config_file:
        app_config = json.load(config_file)

    host = app_config.get('host', LOCAL_RUNSERVER_HOST)
    port = int(app_config.get('backendPort', LOCAL_RUNSERVER_PORT))

    if not is_local_bind_host(host):
        host = LOCAL_RUNSERVER_HOST
        port = LOCAL_RUNSERVER_PORT

    sys.argv.append(f'{host}:{port}')


def main():
    """Run administrative tasks."""
    apply_default_runserver_address()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
