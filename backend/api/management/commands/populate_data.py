from django.core.management.base import BaseCommand
from api.models import Shop, Category, Product, Order, OrderItem, Customer
from django.contrib.auth.models import User
from django.utils import timezone
import random
from decimal import Decimal

class Command(BaseCommand):
    help = 'Populates the database with dummy data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating data...')

        # Categories
        categories = ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Books']
        cat_objs = []
        for name in categories:
            slug = name.lower().replace(' & ', '-').replace(' ', '-')
            # Try to get by slug first to avoid unique constraint error
            cat = Category.objects.filter(slug__iexact=slug).first()
            if not cat:
                cat = Category.objects.filter(name__iexact=name).first()

            if not cat:
                cat = Category.objects.create(
                    name=name, 
                    slug=slug, 
                    description=f'All about {name}', 
                    is_active=True
                )
                self.stdout.write(f'Created Category: {name}')
            
            cat_objs.append(cat)

        # Ensure we have at least one shop
        shops = list(Shop.objects.all())
        if not shops:
             shop = Shop.objects.create(
                 name="Default Shop",
                 email="default@shop.com",
                 address="123 St",
                 city="City",
                 phone="1234567890",
                 current_cycle_start=timezone.now().date()
             )
             shops.append(shop)
        
        # Backfill missing cycle starts
        for shop in shops:
            if not shop.current_cycle_start:
                shop.current_cycle_start = timezone.now().date()
                shop.save()
                self.stdout.write(f'Updated Shop cycle: {shop.name}')
        
        self.stdout.write(f'Using {len(shops)} shops.')

        # Products (10 items)
        product_names = [
            ('Wireless Earbuds', 2999.00), ('Smart Watch', 4500.00), ('Cotton T-Shirt', 499.00),
            ('Denim Jeans', 1299.00), ('Running Shoes', 3500.00), ('Blender', 2500.00),
            ('Coffee Maker', 4000.00), ('Yoga Mat', 800.00), ('Python Programming Book', 1500.00),
            ('LED Desk Lamp', 1200.00)
        ]

        products = []
        for i, (name, price) in enumerate(product_names):
            shop = random.choice(shops)
            category = random.choice(cat_objs)
            # Make unique to avoid slug conflicts if running multiple times
            unique_name = f"{name} {random.randint(1000, 9999)}"
            
            prod = Product.objects.create(
                name=unique_name,
                description=f"High quality {name}",
                price=price,
                stock=random.randint(10, 100),
                commission_rate=Decimal(random.choice([5.00, 10.00, 15.00])),
                shop=shop,
                category=category,
                is_active=True
            )
            products.append(prod)
            self.stdout.write(f'Created Product: {prod.name}')

        # Customers (Ensure at least one)
        customer, _ = Customer.objects.get_or_create(
            email='customer@example.com',
            defaults={'name': 'John Doe', 'phone': '9876543210', 'address': '456 Ave', 'city': 'Metro', 'pincode': '100001'}
        )

        # Orders (5 items)
        for i in range(5):
            # Create order with random items
            order_total = 0
            commission_total = 0
            
            # Create Order first
            order = Order.objects.create(
                customer=customer,
                total_amount=0, # Update later
                commission_amount=0,
                status=random.choice(['pending', 'processing', 'delivered']),
                delivery_address=customer.address,
                delivery_city=customer.city,
                delivery_pincode=customer.pincode
            )

            # Add random items (1-3 items per order)
            # Use random products from the ones we just made
            selected_products = random.sample(products, random.randint(1, 3))
            
            for prod in selected_products:
                qty = random.randint(1, 2)
                # Ensure price is Decimal
                amount = prod.current_price
                if not isinstance(amount, Decimal):
                    amount = Decimal(str(amount))
                    
                price = amount
                comm = price * qty * (prod.commission_rate / Decimal(100))
                
                OrderItem.objects.create(
                    order=order,
                    product=prod,
                    shop=prod.shop,
                    product_name=prod.name,
                    quantity=qty,
                    price=price,
                    commission=comm
                )
                order_total += price * qty
                commission_total += comm
            
            order.total_amount = order_total
            order.commission_amount = commission_total
            order.save()
            self.stdout.write(f'Created Order: {order.order_id}')
            
        # Generate Dummy Billing History
        self.stdout.write('Generating billing history...')
        from api.models import Subscription # Import here or at top
        from datetime import timedelta
        
        for shop in shops:
            # Create 4 weeks of history
            current_date = timezone.now().date()
            for i in range(1, 5):
                end_date = current_date - timedelta(weeks=i)
                start_date = end_date - timedelta(days=6)
                
                # Check if exists to avoid duplicates on re-run
                if not Subscription.objects.filter(shop=shop, start_date=start_date).exists():
                    status = random.choice(['active', 'pending', 'expired'])
                    is_paid = status == 'active'
                    amount = Decimal(random.uniform(500, 5000)).quantize(Decimal('0.01'))
                    
                    Subscription.objects.create(
                        shop=shop,
                        plan_name='Weekly Commission',
                        amount=amount,
                        start_date=start_date,
                        end_date=end_date,
                        status=status,
                        is_paid=is_paid
                    )
                    self.stdout.write(f'Created Billing for {shop.name}: {start_date} - {status}')

        self.stdout.write(self.style.SUCCESS('Successfully populated data.'))
