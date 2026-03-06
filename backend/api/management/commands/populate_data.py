from django.core.management.base import BaseCommand
from api.models import (
    Shop, Category, Product, Order, OrderItem, Customer, 
    Banner, SiteSetting, Subscription, Enquiry
)
from django.contrib.auth.models import User
from django.utils import timezone
import random
from decimal import Decimal
from datetime import timedelta

class Command(BaseCommand):
    help = 'Populates the database with dummy data for all tables'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating all tables with dummy data...')

        # =========================
        # 1. SITE SETTINGS
        # =========================
        setting, created = SiteSetting.objects.get_or_create(
            pk=1,
            defaults={
                'site_name': 'VorionMart',
                'site_tagline': 'Your One-Stop Multi-Vendor Marketplace',
                'contact_email': 'support@VorionMart.com',
                'contact_phone': '+91 9876543210',
                'address': '123 Commerce Street, Tech Park, Bangalore - 560001',
                'facebook_url': 'https://facebook.com/VorionMart',
                'instagram_url': 'https://instagram.com/VorionMart',
                'whatsapp_number': '+919876543210',
                'default_commission': Decimal('10.00')
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Site Settings'))
        else:
            self.stdout.write('Site Settings already exists')

        # =========================
        # 2. SHOPS
        # =========================
        shop_data = [
            {'name': 'TechHub Electronics', 'email': 'techhub@example.com', 'city': 'Mumbai', 'phone': '9876543001'},
            {'name': 'Fashion Forward', 'email': 'fashion@example.com', 'city': 'Delhi', 'phone': '9876543002'},
            {'name': 'Home Essentials', 'email': 'home@example.com', 'city': 'Bangalore', 'phone': '9876543003'},
            {'name': 'Sports Zone', 'email': 'sports@example.com', 'city': 'Chennai', 'phone': '9876543004'},
            {'name': 'Book Worm', 'email': 'books@example.com', 'city': 'Hyderabad', 'phone': '9876543005'},
        ]
        
        shops = []
        for data in shop_data:
            shop, created = Shop.objects.get_or_create(
                email=data['email'],
                defaults={
                    'name': data['name'],
                    'description': f"Your trusted {data['name']} partner for quality products.",
                    'address': f"Shop No. {random.randint(1, 100)}, Main Market",
                    'city': data['city'],
                    'phone': data['phone'],
                    'is_active': True,
                    'current_cycle_start': timezone.now().date()
                }
            )
            shops.append(shop)
            if created:
                self.stdout.write(f'Created Shop: {data["name"]}')
        
        self.stdout.write(f'Total Shops: {len(shops)}')

        # =========================
        # 3. CATEGORIES
        # =========================
        category_data = [
            # Clothing Categories
            {'name': 'Sarees', 'description': 'Beautiful traditional and modern sarees including silk, cotton, georgette, and designer sarees'},
            {'name': "Women's Wear", 'description': 'Trendy women\'s clothing including kurtis, tops, dresses, and western wear'},
            {'name': "Men's Wear", 'description': 'Stylish men\'s clothing including shirts, t-shirts, trousers, and ethnic wear'},
            {'name': "Kids Wear", 'description': 'Adorable clothing for kids including dresses, shirts, ethnic wear, and party wear'},
            {'name': 'Ethnic Wear', 'description': 'Traditional Indian ethnic wear including lehengas, sherwanis, and festive collections'},
            {'name': 'Western Wear', 'description': 'Modern western clothing including jeans, tops, dresses, and casual wear'},
            # Textile Categories
            {'name': 'Home Textiles', 'description': 'Quality home textiles including bedsheets, curtains, towels, and cushion covers'},
            {'name': 'Fabrics', 'description': 'Premium fabrics including cotton, silk, linen, and designer materials'},
            # Accessories
            {'name': 'Fashion Accessories', 'description': 'Stylish accessories including bags, jewelry, watches, and sunglasses'},
            {'name': 'Footwear', 'description': 'Trendy footwear including heels, flats, sandals, and ethnic footwear'},
            # Other Categories
            {'name': 'Beauty & Health', 'description': 'Skincare, makeup, and health products'},
            {'name': 'Electronics', 'description': 'Gadgets, devices, and electronic accessories'},
        ]
        
        categories = []
        for data in category_data:
            slug = data['name'].lower().replace("'s", 's').replace(' & ', '-').replace(' ', '-')
            cat, created = Category.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': data['name'],
                    'description': data['description'],
                    'is_active': True
                }
            )
            categories.append(cat)
            if created:
                self.stdout.write(f'Created Category: {data["name"]}')
        
        self.stdout.write(f'Total Categories: {len(categories)}')

        # =========================
        # 4. PRODUCTS (Clothing & Textile focused)
        # =========================
        product_data = [
            # Sarees
            ('Banarasi Silk Saree - Royal Blue', 4999.00, 3999.00, 'Sarees'),
            ('Kanjivaram Silk Saree - Maroon', 8999.00, 7499.00, 'Sarees'),
            ('Cotton Handloom Saree - White', 1999.00, 1499.00, 'Sarees'),
            ('Georgette Designer Saree - Pink', 2499.00, 1999.00, 'Sarees'),
            ('Chiffon Party Wear Saree', 3499.00, 2799.00, 'Sarees'),
            # Women's Wear
            ('Embroidered Anarkali Kurti - Green', 1299.00, 999.00, "Women's Wear"),
            ('Cotton Palazzo Set - Blue', 1499.00, 1199.00, "Women's Wear"),
            ('Printed Rayon Kurti - Yellow', 799.00, 599.00, "Women's Wear"),
            ('Designer Blouse - Golden', 999.00, 799.00, "Women's Wear"),
            ('Floral Maxi Dress - Red', 1999.00, 1599.00, "Women's Wear"),
            # Men's Wear
            ('Premium Cotton Shirt - White', 1299.00, 999.00, "Men's Wear"),
            ('Slim Fit Formal Trousers - Black', 1499.00, 1199.00, "Men's Wear"),
            ('Casual Polo T-Shirt - Navy', 799.00, 649.00, "Men's Wear"),
            ('Linen Summer Shirt - Beige', 1599.00, 1299.00, "Men's Wear"),
            ('Kurta Pajama Set - Cream', 1999.00, 1599.00, "Men's Wear"),
            # Kids Wear
            ('Girls Party Frock - Pink', 999.00, 799.00, 'Kids Wear'),
            ('Boys Kurta Set - Blue', 899.00, 699.00, 'Kids Wear'),
            ('Kids Denim Jeans - Dark Blue', 699.00, 549.00, 'Kids Wear'),
            ('Girls Lehenga Choli - Red', 1499.00, 1199.00, 'Kids Wear'),
            ('Boys Formal Shirt - White', 599.00, 449.00, 'Kids Wear'),
            # Ethnic Wear
            ('Bridal Lehenga Set - Red Gold', 15999.00, 12999.00, 'Ethnic Wear'),
            ('Designer Sherwani - Ivory', 8999.00, 7499.00, 'Ethnic Wear'),
            ('Festive Anarkali Suit - Purple', 3999.00, 3299.00, 'Ethnic Wear'),
            ('Silk Dupatta - Multi Color', 999.00, 799.00, 'Ethnic Wear'),
            # Western Wear
            ('Skinny Fit Jeans - Black', 1499.00, 1199.00, 'Western Wear'),
            ('Crop Top - White', 599.00, 449.00, 'Western Wear'),
            ('Denim Jacket - Blue', 1999.00, 1599.00, 'Western Wear'),
            ('Casual Jumpsuit - Navy', 1799.00, 1399.00, 'Western Wear'),
            # Home Textiles
            ('Premium Cotton Bedsheet Set', 1299.00, 999.00, 'Home Textiles'),
            ('Silk Cushion Covers Set of 5', 799.00, 599.00, 'Home Textiles'),
            ('Velvet Curtains Pair - Maroon', 1999.00, 1599.00, 'Home Textiles'),
            ('Bath Towel Set - White', 899.00, 699.00, 'Home Textiles'),
            # Footwear
            ('Ethnic Juttis - Golden', 799.00, 599.00, 'Footwear'),
            ('Stiletto Heels - Black', 1499.00, 1199.00, 'Footwear'),
            ('Kolhapuri Sandals - Brown', 699.00, 549.00, 'Footwear'),
            # Fashion Accessories
            ('Designer Clutch Bag - Gold', 999.00, 799.00, 'Fashion Accessories'),
            ('Statement Necklace Set', 1299.00, 999.00, 'Fashion Accessories'),
            ('Silk Scarf - Printed', 499.00, 399.00, 'Fashion Accessories'),
        ]
        
        products = []
        for name, price, sale_price, cat_name in product_data:
            shop = random.choice(shops)
            category = next((c for c in categories if c.name == cat_name), categories[0])
            
            # Check if similar product exists
            existing = Product.objects.filter(name__icontains=name.split()[0]).first()
            if not existing:
                prod = Product.objects.create(
                    name=name,
                    description=f"High-quality {name}. Premium product with excellent features and durability. Perfect for everyday use.",
                    price=Decimal(str(price)),
                    sale_price=Decimal(str(sale_price)) if sale_price else None,
                    stock=random.randint(10, 100),
                    commission_rate=Decimal(random.choice(['5.00', '10.00', '15.00'])),
                    shop=shop,
                    category=category,
                    is_featured=random.choice([True, False]),
                    is_active=True
                )
                products.append(prod)
                self.stdout.write(f'Created Product: {name}')
            else:
                products.append(existing)
        
        self.stdout.write(f'Total Products: {Product.objects.count()}')

        # =========================
        # 5. CUSTOMERS
        # =========================
        customer_data = [
            {'name': 'John Doe', 'email': 'john@example.com', 'phone': '9876543101', 'city': 'Mumbai'},
            {'name': 'Jane Smith', 'email': 'jane@example.com', 'phone': '9876543102', 'city': 'Delhi'},
            {'name': 'Rahul Kumar', 'email': 'rahul@example.com', 'phone': '9876543103', 'city': 'Bangalore'},
            {'name': 'Priya Sharma', 'email': 'priya@example.com', 'phone': '9876543104', 'city': 'Chennai'},
            {'name': 'Amit Patel', 'email': 'amit@example.com', 'phone': '9876543105', 'city': 'Hyderabad'},
        ]
        
        customers = []
        for data in customer_data:
            customer, created = Customer.objects.get_or_create(
                email=data['email'],
                defaults={
                    'name': data['name'],
                    'phone': data['phone'],
                    'address': f'{random.randint(1, 500)} Main Street, Sector {random.randint(1, 50)}',
                    'city': data['city'],
                    'pincode': str(random.randint(100001, 999999))
                }
            )
            customers.append(customer)
            if created:
                self.stdout.write(f'Created Customer: {data["name"]}')
        
        self.stdout.write(f'Total Customers: {len(customers)}')

        # =========================
        # 6. ORDERS (10 orders)
        # =========================
        statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
        
        for i in range(10):
            customer = random.choice(customers)
            order_total = Decimal('0')
            commission_total = Decimal('0')
            
            order = Order.objects.create(
                customer=customer,
                total_amount=0,
                commission_amount=0,
                status=random.choice(statuses),
                delivery_address=customer.address,
                delivery_city=customer.city,
                delivery_pincode=customer.pincode
            )
            
            # Add 1-4 items per order
            selected_products = random.sample(products, min(random.randint(1, 4), len(products)))
            
            for prod in selected_products:
                qty = random.randint(1, 3)
                price = prod.current_price
                if not isinstance(price, Decimal):
                    price = Decimal(str(price))
                
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
        
        self.stdout.write(f'Total Orders: {Order.objects.count()}')

        # =========================
        # 7. BANNERS
        # =========================
        banner_data = [
            {'title': 'New Year Sale', 'subtitle': 'Up to 50% off on all electronics!', 'link': '/products?category=electronics'},
            {'title': 'Fashion Week', 'subtitle': 'Latest trends at unbeatable prices', 'link': '/products?category=fashion'},
            {'title': 'Free Shipping', 'subtitle': 'On orders above ₹999', 'link': '/products'},
        ]
        
        for i, data in enumerate(banner_data):
            banner, created = Banner.objects.get_or_create(
                title=data['title'],
                defaults={
                    'subtitle': data['subtitle'],
                    'link': data['link'],
                    'is_active': True,
                    'order': i + 1
                }
            )
            if created:
                self.stdout.write(f'Created Banner: {data["title"]}')
        
        self.stdout.write(f'Total Banners: {Banner.objects.count()}')

        # =========================
        # 8. SUBSCRIPTIONS
        # =========================
        current_date = timezone.now().date()
        for shop in shops:
            for i in range(4):
                end_date = current_date - timedelta(weeks=i)
                start_date = end_date - timedelta(days=6)
                
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
                    self.stdout.write(f'Created Subscription for {shop.name}')
        
        self.stdout.write(f'Total Subscriptions: {Subscription.objects.count()}')

        # =========================
        # 9. ENQUIRIES
        # =========================
        enquiry_data = [
            {'name': 'Vikram Singh', 'email': 'vikram@example.com', 'subject': 'Bulk Order Inquiry', 'message': 'I want to place a bulk order for corporate gifts. Can you provide a discount?'},
            {'name': 'Sneha Reddy', 'email': 'sneha@example.com', 'subject': 'Product Availability', 'message': 'When will the Wireless Earbuds be back in stock?'},
            {'name': 'Arjun Kapoor', 'email': 'arjun@example.com', 'subject': 'Return Policy', 'message': 'What is your return and refund policy for electronics?'},
            {'name': 'Meera Nair', 'email': 'meera@example.com', 'subject': 'Partnership Opportunity', 'message': 'We are interested in becoming a seller on your platform.'},
            {'name': 'Karan Malhotra', 'email': 'karan@example.com', 'subject': 'Delivery Issue', 'message': 'My order has been delayed. Can you check the status?'},
        ]
        
        for data in enquiry_data:
            enquiry, created = Enquiry.objects.get_or_create(
                email=data['email'],
                subject=data['subject'],
                defaults={
                    'name': data['name'],
                    'message': data['message'],
                    'status': random.choice(['pending', 'responded']),
                    'is_read': random.choice([True, False])
                }
            )
            if created:
                self.stdout.write(f'Created Enquiry: {data["subject"]}')
        
        self.stdout.write(f'Total Enquiries: {Enquiry.objects.count()}')

        # =========================
        # SUMMARY
        # =========================
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(self.style.SUCCESS('DATA POPULATION COMPLETE!'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(f'  Shops: {Shop.objects.count()}')
        self.stdout.write(f'  Categories: {Category.objects.count()}')
        self.stdout.write(f'  Products: {Product.objects.count()}')
        self.stdout.write(f'  Customers: {Customer.objects.count()}')
        self.stdout.write(f'  Orders: {Order.objects.count()}')
        self.stdout.write(f'  Banners: {Banner.objects.count()}')
        self.stdout.write(f'  Subscriptions: {Subscription.objects.count()}')
        self.stdout.write(f'  Enquiries: {Enquiry.objects.count()}')
        self.stdout.write(self.style.SUCCESS('='*50))
