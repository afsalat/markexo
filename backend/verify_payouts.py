import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, PayoutRequest, OrderItem, User
from django.db.models import Sum, F, DecimalField, Value
from django.db.models.functions import Coalesce
from decimal import Decimal

from django.db.models import Q

def verify():
    print("--- Verifying Payouts ---")
    users_with_shops = User.objects.filter(shops__isnull=False).distinct()
    
    for u in users_with_shops:
        print(f"\nUser: {u.email} (ID: {u.id})")
        shops = Shop.objects.filter(owner=u)
        print(f"  Shops: {[s.name for s in shops]}")

        # Items (MATCHING VIEW LOGIC)
        items = OrderItem.objects.filter(
            Q(product__shop__in=shops) | 
            Q(product__created_by=u)
        ).distinct()
        
        count = items.count()
        print(f"  Order Items Count: {count}")

        # Earnings
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
        print(f"  My Earnings: {my_earnings}")

        # Payouts
        all_reqs = PayoutRequest.objects.filter(shop__in=shops)
        print(f"  Total Requests: {all_reqs.count()}")
        for req in all_reqs:
            print(f"    - ID: {req.id}, Amount: {req.amount}, Status: {req.status}")

        paid_pending_qs = all_reqs.exclude(status='rejected')
        paid_pending_sum = paid_pending_qs.aggregate(p=Sum('amount'))['p'] or Decimal('0.00')
        print(f"  Sum Paid/Pending: {paid_pending_sum}")

        # Balance
        avail = my_earnings - paid_pending_sum
        print(f"  CALCULATED AVAILABLE: {avail}")
        
        # TEST CREATE
        if avail > 0:
            print("  [TEST] Creating Test Payout Request for 1.00...")
            shop = shops.first()
            PayoutRequest.objects.create(
                amount=Decimal('1.00'),
                shop=shop,
                status='pending',
                notes='Test from Agent',
                bank_account_details='Test Bank'
            )
            print("  [TEST] Created.")
            
            # Re-check
            new_reqs = PayoutRequest.objects.filter(shop__in=shops)
            print(f"  Total Requests Now: {new_reqs.count()}")

if __name__ == "__main__":
    verify()
