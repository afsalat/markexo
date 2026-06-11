import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product

print("Extra Products in Database (not in products.json):")
import json
with open('products.json', 'r', encoding='utf-8') as f:
    json_products = json.load(f)
json_slugs = {p.get('slug') for p in json_products if p.get('slug')}

for p in Product.objects.all().order_by('id'):
    if p.slug not in json_slugs:
        print(f"ID: {p.id}, Slug: {p.slug}, Name: {p.name[:40]}, Created: {p.created_at}")
