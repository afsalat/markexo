import os
import sys
import django
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product
from api.serializers import ProductSerializer  # if serializers exist

p = Product.objects.filter(id=124).first()
if p:
    print("Product 124 details:")
    print("Name:", p.name)
    print("Slug:", p.slug)
    print("MRP:", p.mrp)
    print("Our Price:", p.our_price)
    print("Description:", p.description)
    print("Is Active:", p.is_active)
    print("Category:", p.category.name if p.category else None)
    print("Shop:", p.shop.name if p.shop else None)
else:
    print("Product 124 not found in database!")
