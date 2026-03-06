
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, User

def check_shop_owner():
    shop = Shop.objects.filter(name="Home Essentials").first()
    if shop:
        print(f"Shop: {shop.name} (ID: {shop.id})")
        if shop.owner:
            print(f"Owner: {shop.owner.username} (Email: {shop.owner.email}, ID: {shop.owner.id})")
        else:
            print("Owner: None")
    else:
        print("Shop 'Home Essentials' not found.")
        
    user_john = User.objects.filter(email__icontains="john").first()
    print(f"User John: {user_john.username} (ID: {user_john.id})")

if __name__ == "__main__":
    check_shop_owner()
