
import os
import django
from django.db.models import Q
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Product, Shop

def find_missing_products():
    print("--- Listing Last 10 Products ---")
    products = Product.objects.all().order_by('-created_at')[:10]
    
    for p in products:
        shop_name = p.shop.name if p.shop else "None"
        shop_owner = p.shop.owner.username if p.shop and p.shop.owner else "None"
        print(f"ID: {p.id}, Name: {p.name}, Shop: {shop_name} (Owner: {shop_owner})")

if __name__ == '__main__':
    find_missing_products()
