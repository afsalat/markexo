import os
import sys
import django

# Add the backend directory to sys.path so we can import modules
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from django.contrib.auth.models import User

target_username = "john"
print(f"Checking for user: {target_username}")

try:
    u = User.objects.get(username=target_username)
    print(f"User '{target_username}' FOUND.")
    print(f"  - Email: {u.email}")
    print(f"  - Is Active: {u.is_active}")
    print(f"  - Is Staff: {u.is_staff}")
    print(f"  - Is Superuser: {u.is_superuser}")
except User.DoesNotExist:
    print(f"User '{target_username}' NOT FOUND.")

print("\nListing all users:")
for user in User.objects.all():
    print(f"- ID: {user.id} | Username: '{user.username}' | Email: '{user.email}' | Active: {user.is_active} | Staff: {user.is_staff}")
