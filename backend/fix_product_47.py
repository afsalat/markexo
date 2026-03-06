
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Product, Shop
from django.contrib.auth.models import User

def fix_product_47():
    try:
        product = Product.objects.get(id=47)
        user = User.objects.get(id=6)
        
        print(f"Product found: {product.name} (ID: 47)")
        print(f"Current Shop: {product.shop.name} (ID: {product.shop.id})")
        print(f"Target User: {user.username} (ID: 6)")
        
        # Update created_by
        product.created_by = user
        product.save()
        print(f"Success: Updated created_by to User 6 for Product 47.")
        
        # Check shop ownership for visibility
        user_shops = Shop.objects.filter(owner=user)
        if user_shops.exists():
            print(f"User 6 owns shops: {[s.name for s in user_shops]}")
            if product.shop not in user_shops:
                print(f"WARNING: Product 47 is in '{product.shop.name}' which is NOT owned by User 6.")
                print("The product will likely NOT be visible to this user in the partner dashboard.")
                print("To fix visibility, the product needs to be moved to one of the user's shops.")
            else:
                print("Verification: Product is in a shop owned by the user. It should be visible.")
        else:
            print("User 6 owns NO shops.")

    except Product.DoesNotExist:
        print("Product 47 not found.")
    except User.DoesNotExist:
        print("User 6 not found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    fix_product_47()
