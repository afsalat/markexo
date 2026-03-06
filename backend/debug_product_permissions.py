
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Product, Shop, User

def debug_products():
    print("--- Debugging Product Visibility ---")
    
    # Get User John
    user = User.objects.filter(email__icontains="john").first()
    if not user:
         user = User.objects.filter(username__icontains="john").first()
    
    # Get Shop Home Essentials
    shop = Shop.objects.filter(name="Home Essentials").first()
    
    if not user or not shop:
        print("User or Shop not found.")
        return

    print(f"User: {user.username} (ID {user.id})")
    print(f"Shop: {shop.name} (ID {shop.id}, Owner: {shop.owner.username if shop.owner else 'None'})") # Should be john now

    # Check products for this shop
    products = Product.objects.filter(shop=shop)
    print(f"Total Products in 'Home Essentials': {products.count()}")
    
    for p in products:
        creator = p.created_by.username if p.created_by else "None"
        creator_id = p.created_by.id if p.created_by else "None"
        print(f" - Product: {p.name}")
        print(f"   Created By: {creator} (ID {creator_id})")
        print(f"   Visible to John? {p.created_by == user}")

    # Check query logic simulation
    visible_products = Product.objects.filter(created_by=user)
    print(f"Total Visible Products (created_by=john): {visible_products.count()}")

if __name__ == "__main__":
    debug_products()
