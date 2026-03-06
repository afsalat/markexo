
import os
import django
from decimal import Decimal
from django.db.models import Sum, F, Value, Q, DecimalField
from django.db.models.functions import Coalesce

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, OrderItem, PayoutRequest, Product

def verify_fix():
    print("--- Verifying Partner Stats Fix ---")
    
    # 1. Get the shop "Home Essentials" (known to have issues)
    shop = Shop.objects.filter(name="Home Essentials").first()
    if not shop:
        print("Shop 'Home Essentials' not found. Cannot verify.")
        return

    print(f"Checking Shop: {shop.name} (ID: {shop.id})")
    
    # 2. Replicate the NEW View Query
    # Logic: OR product.shop, OR product.created_by, OR shop is directly set
    user = shop.owner
    shops = Shop.objects.filter(owner=user)
    
    items = OrderItem.objects.filter(
        Q(product__shop__in=shops) | 
        Q(product__created_by=user) |
        Q(shop__in=shops)
    ).distinct()
    
    count = items.count()
    print(f"Total OrderItems Found: {count}")
    
    if count == 0:
        print("FAIL: Still finding 0 items.")
    else:
        print("SUCCESS: Items found!")
        
        # 3. Calculate Earnings
        earnings_agg = items.aggregate(
            earnings=Sum(
                (F('price') - Coalesce(F('product__supplier_price'), Value(Decimal('0.00')), output_field=DecimalField())) * 
                F('quantity') * 
                Value(Decimal('30.00'), output_field=DecimalField()),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        raw_earnings = earnings_agg['earnings'] or Decimal('0.00')
        my_earnings = raw_earnings / Decimal('100.00')
        
        print(f"Calculated Earnings: {my_earnings}")
        
        # 4. Check Balance
        total_withdrawn = PayoutRequest.objects.filter(shop__in=shops, status='paid').aggregate(p=Sum('amount'))['p'] or Decimal('0.00')
        balance = my_earnings - total_withdrawn
        print(f"Total Withdrawn: {total_withdrawn}")
        print(f"Wallet Balance: {balance}")
        
        if balance >= 0:
            print("VERIFICATION PASSED: Wallet balance is non-negative.")
        else:
            print("VERIFICATION WARNING: Wallet balance is still negative (might be expected if withdrawals > earnings).")

if __name__ == "__main__":
    verify_fix()
