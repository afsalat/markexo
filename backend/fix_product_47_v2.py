
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Product, Shop
from django.contrib.auth.models import User

def fix_product_47_v2():
    try:
        product = Product.objects.get(id=47)
        user = User.objects.get(id=6)
        
        # Update created_by
        product.created_by = user
        product.save()
        
        print(f"Update: Product 47 'created_by' set to User 6.")
        
        # Check shop ownership for visibility
        user_shops = Shop.objects.filter(owner=user)
        user_shop = user_shops.first()
        
        if user_shop:
            if product.shop != user_shop:
                print(f"Notice: Product is in shop '{product.shop.name}' (ID {product.shop.id}).")
                print(f"User 6 owns '{user_shop.name}' (ID {user_shop.id}).")
                # Automatically fix the shop too since it's clearly a mistake
                product.shop = user_shop
                product.save()
                print(f"Fix: Automatically moved Product 47 to shop '{user_shop.name}' so it becomes visible.")
        else:
            print("User 6 owns NO shops.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix_product_47_v2()
