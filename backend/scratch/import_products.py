import os
import sys
import json
import django
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from django.db import transaction
from api.models import Product, Category, Shop

def import_products():
    input_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'products.json')
    if not os.path.exists(input_path):
        print(f"Error: Input file products.json not found at {input_path}", file=sys.stderr)
        sys.exit(1)
        
    print(f"Reading product updates from: {input_path}")
    with open(input_path, 'r', encoding='utf-8') as f:
        try:
            products_data = json.load(f)
        except Exception as json_err:
            print(f"Error: Failed to parse products.json. Verify JSON format and quotes. Detail: {json_err}", file=sys.stderr)
            sys.exit(1)
        
    print(f"Found {len(products_data)} products in JSON. Pushing changes to the active database...")
    
    updated_count = 0
    created_count = 0
    
    try:
        with transaction.atomic():
            for item in products_data:
                p_id = item.get('id')
                sku = item.get('sku', '')
                slug = item.get('slug', '')
                name = item.get('name', '')
                
                if not name:
                    print("Warning: Skipping product item with missing 'name' field.")
                    continue
                
                # Try finding existing product
                product = None
                if p_id:
                    product = Product.objects.filter(id=p_id).first()
                if not product and sku:
                    product = Product.objects.filter(sku=sku).first()
                if not product and slug:
                    product = Product.objects.filter(slug=slug).first()
                    
                is_new = False
                if not product:
                    print(f"Product '{name}' not found in database. Creating new record...")
                    product = Product(name=name)
                    is_new = True
                
                # Update basic fields
                product.name = name
                if slug:
                    product.slug = slug
                product.description = item.get('description', '')
                
                # Safe Decimal parser helper
                def parse_decimal(val):
                    if val is None or str(val).strip() == '':
                        return Decimal('0.00')
                    try:
                        return Decimal(str(val))
                    except Exception:
                        return Decimal('0.00')
                
                product.mrp = parse_decimal(item.get('mrp'))
                product.our_price = parse_decimal(item.get('our_price'))
                product.supplier_price = parse_decimal(item.get('supplier_price'))
                product.stock = int(item.get('stock', 0))
                product.sku = sku
                product.meesho_url = item.get('meesho_url', '')
                product.is_featured = bool(item.get('is_featured', False))
                product.is_active = bool(item.get('is_active', True))
                product.approval_status = item.get('approval_status', 'approved')
                product.rating = parse_decimal(item.get('rating'))
                product.review_count = int(item.get('review_count', 0))
                product.views = int(item.get('views', 0))
                product.sold_count = int(item.get('sold_count', 0))
                
                # specifications mapping
                product.specifications = item.get('specifications', {})
                
                # Link Category
                cat_data = item.get('category')
                if cat_data:
                    cat_id = cat_data.get('id')
                    cat_slug = cat_data.get('slug')
                    category = None
                    if cat_id:
                        category = Category.objects.filter(id=cat_id).first()
                    if not category and cat_slug:
                        category = Category.objects.filter(slug=cat_slug).first()
                    if category:
                        product.category = category
                        
                # Link Shop
                shop_data = item.get('shop')
                if shop_data:
                    shop_id = shop_data.get('id')
                    shop_slug = shop_data.get('slug')
                    shop = None
                    if shop_id:
                        shop = Shop.objects.filter(id=shop_id).first()
                    if not shop and shop_slug:
                        shop = Shop.objects.filter(slug=shop_slug).first()
                    if shop:
                        product.shop = shop
                        
                # Save product
                product.save()
                
                if is_new:
                    created_count += 1
                else:
                    updated_count += 1
                    
        print(f"\nSUCCESSFUL DATABASE SYNC:")
        print(f"  - Products Updated: {updated_count}")
        print(f"  - Products Created: {created_count}")
        
    except Exception as e:
        print(f"\nCRITICAL SYNC ERROR (Transaction rolled back safely): {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    import_products()
