from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Shop, Subscription, Order
from django.db.models import Sum
from datetime import timedelta

class Command(BaseCommand):
    help = 'Process weekly commission cycles for shops'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        self.stdout.write(f"Running weekly cycle check for {today}")

        # Task 1: Check for completed cycles (Day 7)
        # Find shops where today is 7 days after current_cycle_start
        # If current_cycle_start is None, set it to today for new shops
        
        shops = Shop.objects.filter(is_active=True)
        for shop in shops:
            if not shop.current_cycle_start:
                shop.current_cycle_start = today
                shop.save()
                continue
            
            cycle_end_date = shop.current_cycle_start + timedelta(days=7)
            
            if today >= cycle_end_date:
                self.process_billing(shop, shop.current_cycle_start, cycle_end_date)
                # Cycle resets only after payment or if we want to force distinct periods?
                # Per requirement: "continue next 7 days" implies contiguous cycles.
                # However, if not paid, products become inactive.
                # We update the cycle start ONLY if payment is made? 
                # Or do we generate bills regardless? 
                # Let's generate bills for the past period. The Shop keeps the same cycle start 
                # unless we want to shift it. Usually cycles are fixed windows.
                # Let's shift the window forward.
                shop.current_cycle_start = cycle_end_date
                shop.save()

        # Task 2: Check for overdue payments and deactivate products
        # Grace period: 2 days
        overdue_subs = Subscription.objects.filter(
            status='pending', 
            end_date__lt=today - timedelta(days=2)
        )
        
        for sub in overdue_subs:
            shop = sub.shop
            if shop.is_active: # Only if not already processed/inactive
                self.stdout.write(f"Deactivating products for shop {shop.name} due to unpaid subscription {sub.id}")
                shop.products.update(is_active=False)
                # Optionally mark shop as restricted? 
                # Keep shop active but products inactive seems to be the requirement.

    def process_billing(self, shop, start_date, end_date):
        item_filters = {
            'items__shop': shop,
            'created_at__date__gte': start_date,
            'created_at__date__lt': end_date
        }
        
        # Calculate total commission for orders in this period
        # Note: Order contains total commission across all items usually?
        # But here we need commission specific to this shop's items in the order.
        # OrderItem has the commission field.
        
        from api.models import OrderItem
        
        total_commission = OrderItem.objects.filter(
            shop=shop,
            order__created_at__date__gte=start_date,
            order__created_at__date__lt=end_date
        ).aggregate(Sum('commission'))['commission__sum'] or 0

        if total_commission > 0:
            self.stdout.write(f"Generating bill for {shop.name}: {total_commission}")
            Subscription.objects.create(
                shop=shop,
                plan_name=f"Weekly Commission ({start_date} to {end_date})",
                amount=total_commission,
                start_date=start_date,
                end_date=end_date,
                status='pending'
            )
        else:
            self.stdout.write(f"No commission for {shop.name} in this period. Skipping bill.")
