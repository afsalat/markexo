import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product, OrderItem, Review

import json
with open('products.json', 'r', encoding='utf-8') as f:
    json_products = json.load(f)
json_slugs = {p.get('slug') for p in json_products if p.get('slug')}

extra_products = Product.objects.exclude(slug__in=json_slugs)
print(f"Found {extra_products.count()} extra products in DB.")

for p in extra_products:
    order_items_count = OrderItem.objects.filter(product=p).count()
    reviews_count = Review.objects.filter(product=p).count()
    print(f"Product ID {p.id} ({p.slug}): OrderItems: {order_items_count}, Reviews: {reviews_count}")
