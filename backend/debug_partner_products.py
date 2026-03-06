
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Shop, Product

def debug_users_and_shops():
    with open('debug_output_utf8.txt', 'w', encoding='utf-8') as f:
        f.write("--- Users and their Shops ---\n")
        users = User.objects.all()
        for user in users:
            shops = Shop.objects.filter(owner=user)
            shop_names = list(shops.values_list('name', flat=True))
            f.write(f"User: {user.username} (ID: {user.id}), IsSuperuser: {user.is_superuser}, IsStaff: {user.is_staff}\n")
            if shop_names:
                f.write(f"  Owns Shops: {shop_names}\n")
            else:
                f.write(f"  Owns NO Shops\n")

        f.write("\n--- Products and their Shops ---\n")
        products = Product.objects.all().select_related('shop', 'shop__owner')
        for p in products:
            owner_name = p.shop.owner.username if p.shop and p.shop.owner else "No Owner"
            f.write(f"Product: {p.name} (ID: {p.id}), Shop: {p.shop.name} (ID: {p.shop.id}), Shop Owner: {owner_name}\n")

if __name__ == '__main__':
    debug_users_and_shops()
