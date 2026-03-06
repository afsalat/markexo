import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Product, User

product_name = "jsodfjiodsjfodsfjnjo"
try:
    product = Product.objects.get(name=product_name)
    print(f"Product: {product.name}")
    print(f"Shop: {product.shop.name}")
    if product.created_by:
        print(f"Created by: {product.created_by.username} ({product.created_by.email})")
    else:
        print("Created by: None")
    
    if product.shop.owner:
        print(f"Shop Owner: {product.shop.owner.username} ({product.shop.owner.email})")
    else:
        print("Shop Owner: None")

except Product.DoesNotExist:
    print(f"Product with name '{product_name}' not found.")
except Exception as e:
    print(f"Error: {e}")
