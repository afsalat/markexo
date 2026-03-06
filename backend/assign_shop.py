
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, User

def assign_shop_to_john():
    print("--- Assigning 'Home Essentials' to 'john' ---")
    
    # Get Shop
    shop = Shop.objects.filter(name="Home Essentials").first()
    if not shop:
        print("Shop 'Home Essentials' not found.")
        return

    # Get User
    user = User.objects.filter(email__icontains="john").first()
    if not user:
         user = User.objects.filter(username__icontains="john").first()
    
    if not user:
        print("User 'john' not found.")
        return

    print(f"Current Owner: {shop.owner}")
    
    if shop.owner != user:
        shop.owner = user
        shop.save()
        print(f"SUCCESS: Assigned '{shop.name}' (ID {shop.id}) to user '{user.username}' (ID {user.id}).")
    else:
        print(f"Shop is already owned by '{user.username}'.")

if __name__ == "__main__":
    assign_shop_to_john()
