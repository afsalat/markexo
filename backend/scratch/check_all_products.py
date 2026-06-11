import os
import sys
import json
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product

with open('products.json', 'r', encoding='utf-8') as f:
    json_products = json.load(f)

json_slugs = {p.get('slug') for p in json_products if p.get('slug')}
json_ids = {p.get('id') for p in json_products if p.get('id')}

print("JSON Products count:", len(json_products))
print("DB Products count:", Product.objects.count())

print("\nDB products not in JSON by slug:")
for p in Product.objects.all():
    if p.slug not in json_slugs:
        print(f"ID: {p.id}, Slug: {p.slug}, Name: {p.name[:50]}")

print("\nJSON products not in DB by slug:")
for p in json_products:
    slug = p.get('slug')
    if slug and not Product.objects.filter(slug=slug).exists():
        print(f"Slug: {slug}, Name: {p.get('name')[:50]}")
