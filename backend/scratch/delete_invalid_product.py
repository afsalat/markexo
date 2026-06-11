import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product

p = Product.objects.filter(slug='asndaisd').first()
if p:
    print(f"Found product with slug 'asndaisd': {p.name} (ID: {p.id})")
    p.delete()
    print("Deleted successfully!")
else:
    print("Product with slug 'asndaisd' not found in database.")
