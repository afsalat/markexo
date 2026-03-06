
import os
import django
from django.db.models import Sum, F, DecimalField, Value, Q
from django.db.models.functions import Coalesce

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import OrderItem, Shop, Product, User


from decimal import Decimal

def debug_earnings():
    print("Debugging Partner Earnings...")
    
    # Try to find the user likely to be logged in (e.g., has products but maybe no shop, or just the one with recent activity)
    # Let's check users who have products created
    users_with_products = User.objects.annotate(p_count=Count('created_products')).filter(p_count__gt=0)
    
    for user in users_with_products:
        print(f"\nChecking User: {user.username} (ID: {user.id})")
        
        shops = Shop.objects.filter(owner=user)
        print(f"  Shops: {list(shops)}")
        
        items = OrderItem.objects.filter(
            Q(product__shop__in=shops) | 
            Q(product__created_by=user)
        ).distinct()
        
        print(f"  Found {items.count()} order items.")
        
        if items.count() == 0:
            continue
            
        # Inspect individual items
        print("  Item Details:")
        for item in items:
            product = item.product
            shop_commission = product.shop.commission_rate if product.shop else None
            supplier_price = product.supplier_price
            
            print(f"    - Product: {product.name}")
            print(f"      Price (Sold At): {item.price}")
            print(f"      Supplier Price: {supplier_price}")
            print(f"      Shop Commission: {shop_commission}")
            
            # Manual Calc
            sp = item.price
            sup = supplier_price if supplier_price is not None else 0
            
            profit = sp - sup
            rate = shop_commission if shop_commission is not None else 30
            commission = profit * item.quantity * (rate / 100)
            
            print(f"      -> Profit: {profit}, Rate: {rate}%, Commission: {commission}")

        # Intermediate Aggregations
        print("  Intermediate Aggregations:")
        
        # 1. Total Price
        agg1 = items.aggregate(total_price=Sum(F('price') * F('quantity'), output_field=DecimalField()))
        print(f"    Total Price: {agg1['total_price']}")
        
        # 2. total_supplier_price
        agg2 = items.aggregate(total_supplier=Sum(Coalesce(F('product__supplier_price'), Value(Decimal('0')), output_field=DecimalField()) * F('quantity'), output_field=DecimalField()))
        print(f"    Total Supplier Cost: {agg2['total_supplier']}")
        
        # 3. Profit
        agg3 = items.aggregate(
            profit=Sum(
                (F('price') - Coalesce(F('product__supplier_price'), Value(Decimal('0')), output_field=DecimalField())) * F('quantity'),
                output_field=DecimalField()
            )
        )
        print(f"    Total Profit: {agg3['profit']}")

        # 4. Commission Rate 
        # Check if we can average it or something? No, just try sum of rates?
        # Let's try to just sum commission for a    print(f"Total Sales: {total_sales}")

    # Calculate Earnings
    from django.db.models.functions import Coalesce
    
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
    
    print(f"Calculated Earnings (Backend Logic): {my_earnings}")
    
    # Calculate Pending Amount
    from api.models import PayoutRequest
    pending_payouts = PayoutRequest.objects.filter(shop__in=shops).exclude(status='rejected').aggregate(p=Sum('amount'))['p'] or Decimal('0.00')
    pending_amount = my_earnings - pending_payouts
    
    print(f"Pending Payouts: {pending_payouts}")
    print(f"Pending Amount (Available): {pending_amount}")

if __name__ == '__main__':
    from django.db.models import Count
    debug_earnings()
