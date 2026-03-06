from api.models import Category

# Clear all first
Category.objects.all().delete()

categories_data = [
    ('Electronics', ['Mobiles', 'Laptops', 'Tablets', 'Cameras', 'Headphones']),
    ('Fashion', ['Men Wear', 'Women Wear', 'Kids Wear', 'Footwear', 'Accessories']),
    ('Home Kitchen', ['Furniture', 'Appliances', 'Decor', 'Bedding', 'Cookware']),
    ('Beauty Health', ['Skincare', 'Haircare', 'Makeup', 'Wellness', 'Perfumes']),
    ('Sports Fitness', ['Gym', 'Sportswear', 'Outdoor', 'Yoga', 'Cycling']),
    ('Books Stationery', ['Fiction', 'Educational', 'Notebooks', 'Art', 'Office']),
    ('Toys Games', ['Action', 'Board Games', 'Learning', 'Outdoor Toys', 'Puzzles']),
    ('Grocery', ['Fruits', 'Vegetables', 'Dairy', 'Snacks', 'Beverages']),
    ('Automotive', ['Car Parts', 'Bike Parts', 'Tools', 'Oils', 'Tyres']),
    ('Jewelry', ['Gold', 'Silver', 'Imitation', 'Earrings', 'Necklaces']),
    ('Baby Kids', ['Clothing', 'Toys', 'Feeding', 'Diapers', 'Furniture']),
    ('Office Supplies', ['Chairs', 'Desks', 'Storage', 'Tech', 'Decor']),
]

for cat_name, subcats in categories_data:
    slug = cat_name.lower().replace(' ', '-')
    parent = Category.objects.create(name=cat_name, slug=slug, is_active=True)
    for sub in subcats:
        sub_slug = f"{slug}-{sub.lower().replace(' ', '-')}"
        Category.objects.create(name=sub, slug=sub_slug, parent=parent, is_active=True)

print(f"Created 12 categories with 5 subcategories each. Total: {Category.objects.count()}")
