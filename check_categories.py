
import os
import django
import sys

# Add backend to path
sys.path.append('C:\\Users\\USER\\Desktop\\markexo\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Category, Product

def check_categories():
    print(f"{'ID':<4} | {'Name':<20} | {'Slug':<20} | {'Active':<8} | {'Parent':<15} | {'Products':<8}")
    print("-" * 100)
    for cat in Category.objects.all().order_by('id'):
        parent_name = cat.parent.name if cat.parent else "None"
        product_count = cat.products.count()
        active_products = cat.products.filter(is_active=True).count()
        print(f"{cat.id:<4} | {cat.name:<20} | {cat.slug:<20} | {str(cat.is_active):<8} | {parent_name:<15} | {active_products}/{product_count}")

if __name__ == "__main__":
    check_categories()
