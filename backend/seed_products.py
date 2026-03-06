import random
from api.models import Product, Category, Shop
from django.contrib.auth.models import User

# Get first shop and some categories
shop = Shop.objects.first()
categories = list(Category.objects.filter(parent__isnull=False)[:12])  # Get subcategories
admin_user = User.objects.filter(is_superuser=True).first()

products_data = [
    ("Wireless Bluetooth Headphones", "Premium over-ear headphones with noise cancellation", 2999, 2499),
    ("Running Sneakers Pro", "Lightweight athletic shoes for runners", 3499, 2999),
    ("Smart Fitness Watch", "Track your health and fitness goals", 4999, 3999),
    ("Laptop Backpack", "Water-resistant backpack with USB charging port", 1999, 1499),
    ("Portable Bluetooth Speaker", "360-degree sound with 12-hour battery", 2499, 1999),
    ("Yoga Mat Premium", "Non-slip eco-friendly yoga mat", 999, 799),
    ("Stainless Steel Water Bottle", "Insulated bottle keeps drinks cold 24hrs", 699, 549),
    ("LED Desk Lamp", "Adjustable brightness with USB charging", 1299, 999),
    ("Wireless Keyboard & Mouse", "Ergonomic design with silent keys", 1799, 1399),
    ("Gaming Mouse Pad XL", "Extended size with stitched edges", 599, 449),
    ("Phone Stand Holder", "Adjustable aluminum stand for phones and tablets", 499, 349),
    ("USB-C Hub Adapter", "7-in-1 hub for laptops with HDMI and SD card", 1999, 1599),
    ("Noise Cancelling Earbuds", "True wireless earbuds with ANC", 3999, 2999),
    ("Leather Wallet Men", "Genuine leather bifold wallet", 899, 699),
    ("Women Handbag Tote", "Stylish large capacity shoulder bag", 1499, 1199),
    ("Kids Educational Tablet", "Learning tablet for children age 3-8", 2999, 2499),
    ("Kitchen Blender", "High-speed blender for smoothies", 2499, 1999),
    ("Air Purifier Mini", "HEPA filter for clean air at home", 3499, 2799),
    ("Electric Kettle 1.5L", "Fast boiling stainless steel kettle", 1299, 999),
    ("Digital Weighing Scale", "Smart scale with body composition analysis", 1499, 1199),
]

created = 0
for i, (name, desc, mrp, price) in enumerate(products_data):
    cat = categories[i % len(categories)] if categories else None
    Product.objects.create(
        name=name,
        description=desc,
        mrp=mrp,
        price=price,
        sale_price=price,
        our_price=price,
        supplier_price=int(price * 0.6),
        stock=random.randint(10, 100),
        sku=f"SKU{str(i+1).zfill(4)}",
        category=cat,
        shop=shop,
        is_active=True,
        is_featured=(i < 5),
        created_by=admin_user
    )
    created += 1

print(f"Created {created} products")
