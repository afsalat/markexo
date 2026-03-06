import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView
from api.models import User, Shop
from api.views import PartnerDashboardStatsView

def verify_view_logic():
    print("--- Verifying View Logic as User 'john' ---")
    
    # 1. Find User
    user = User.objects.filter(email__icontains="john").first()
    if not user:
         user = User.objects.filter(username__icontains="john").first()
    
    if not user:
        print("ERROR: User 'john' not found.")
        return

    print(f"User Found: {user.username} ({user.email}) ID: {user.id}")
    
    # Check Shops
    shops = Shop.objects.filter(owner=user)
    print(f"Shops owned: {[s.name for s in shops]}")
    
    # 2. Simulate Request
    factory = APIRequestFactory()
    view = PartnerDashboardStatsView.as_view()
    
    request = factory.get('/api/admin/partner-stats/')
    force_authenticate(request, user=user)
    
    # 3. Get Response
    try:
        response = view(request)
        if response.status_code == 200:
            data = response.data
            print("\nAPI Response Data:")
            print(f"  My Earnings: {data.get('my_earnings')}")
            print(f"  Total Sales: {data.get('total_sales')}")
            print(f"  Wallet Balance: {data.get('pending_amount')}")
            print(f"  Total Withdrawn: {data.get('total_withdrawn')}")
            
            if float(data.get('my_earnings') or 0) > 0:
                print("SUCCESS: Earnings are positive!")
            else:
                print("FAIL: Earnings are still 0.")
        else:
            print(f"ERROR: View returned status {response.status_code}")
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    verify_view_logic()
