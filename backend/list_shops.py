import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, User

print(f"{'Shop Name':<30} | {'Owner':<30}")
print("-" * 65)
for shop in Shop.objects.all():
    owner_str = f"{shop.owner.username} ({shop.owner.email})" if shop.owner else "None"
    print(f"{shop.name:<30} | {owner_str:<30}")
