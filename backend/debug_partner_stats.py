
import os
import django
from decimal import Decimal
from django.db.models import Sum, F, Value, Q, DecimalField

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from api.models import Shop, OrderItem, PayoutRequest, Product

def debug_partner_stats():
    # Find shops
    s1 = Shop.objects.filter(name="kockolic").first()
    if s1:
        owner_email = s1.owner.email if s1.owner else "None"
        print(f"Shop: {s1.name}, ID: {s1.id}, Owner: {owner_email}")
    
    s2 = Shop.objects.filter(name="Home Essentials").first()
    if s2:
        owner_email = s2.owner.email if s2.owner else "None"
        print(f"Shop: {s2.name}, ID: {s2.id}, Owner: {owner_email}")
        
    # Check orphaned items for Home Essentials
    if s2:
        orphans = OrderItem.objects.filter(shop=s2, product__isnull=True)
        print(f"Orphaned Items for Home Essentials (ID {s2.id}): {orphans.count()}")
        
        # Calculate potential earnings
        earnings = 0
        for o in orphans:
             earnings += (o.price * o.quantity * Decimal('0.30'))
        print(f"Potential Missing Earnings: {earnings}")

debug_partner_stats()
