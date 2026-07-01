"""
Management command to restore all categories and products from the
products.json snapshot that was exported from the original database.

Usage (run inside the backend container):
    python manage.py restore_products_from_json

Or from Coolify terminal:
    docker exec -it <backend-container> python manage.py restore_products_from_json
"""

import json
import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from api.models import Category, Product, ProductImage


DATA_FILE = os.path.join(settings.BASE_DIR, 'products_snapshot.json')


class Command(BaseCommand):
    help = 'Restore categories and products from products_snapshot.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be imported without writing to DB',
        )
        parser.add_argument(
            '--file',
            type=str,
            default=DATA_FILE,
            help='Path to the JSON snapshot file (default: backend/products_snapshot.json)',
        )

    def handle(self, *args, **options):
        json_path = options['file']
        dry_run = options['dry_run']

        if not os.path.exists(json_path):
            self.stderr.write(self.style.ERROR(
                f'File not found: {json_path}\n'
                f'Make sure products_snapshot.json is in the backend/ directory.'
            ))
            return

        with open(json_path, encoding='utf-8') as f:
            products_data = json.load(f)

        self.stdout.write(self.style.SUCCESS(
            f'Loaded {len(products_data)} products from snapshot.'
        ))
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes will be saved.'))

        categories_created = 0
        categories_existing = 0
        products_created = 0
        products_existing = 0
        images_created = 0

        # ── Step 1: Restore all categories first ─────────────────────────────
        self.stdout.write('\n── Restoring Categories ──')
        cat_id_map = {}  # original_id → Category instance

        seen_cat_ids = set()
        for item in products_data:
            cat_data = item.get('category')
            if not cat_data or cat_data['id'] in seen_cat_ids:
                continue
            seen_cat_ids.add(cat_data['id'])

            cat_name = cat_data['name']
            cat_slug = cat_data['slug']

            existing = Category.objects.filter(slug=cat_slug).first()
            if existing:
                cat_id_map[cat_data['id']] = existing
                categories_existing += 1
                self.stdout.write(f'  [EXISTS] Category: {cat_name}')
            else:
                if not dry_run:
                    cat = Category.objects.create(
                        name=cat_name,
                        slug=cat_slug,
                        is_active=True,
                    )
                    cat_id_map[cat_data['id']] = cat
                categories_created += 1
                self.stdout.write(self.style.SUCCESS(f'  [CREATE] Category: {cat_name}'))

        self.stdout.write(
            f'\n  Categories: {categories_created} created, {categories_existing} already existed.'
        )

        # ── Step 2: Restore Products ──────────────────────────────────────────
        self.stdout.write('\n── Restoring Products ──')

        for item in products_data:
            slug = item.get('slug', '')
            name = item.get('name', '')

            # Skip if already exists
            if Product.objects.filter(slug=slug).exists():
                products_existing += 1
                self.stdout.write(f'  [EXISTS] {name}')
                continue

            cat_data = item.get('category')
            category = None
            if cat_data:
                orig_id = cat_data['id']
                category = cat_id_map.get(orig_id)
                if not category:
                    # fallback: look up by slug in DB
                    category = Category.objects.filter(slug=cat_data['slug']).first()

            def to_decimal(val):
                if val is None:
                    return None
                try:
                    return Decimal(str(val))
                except Exception:
                    return None

            mrp        = to_decimal(item.get('mrp'))
            our_price  = to_decimal(item.get('our_price'))
            price      = to_decimal(item.get('price'))
            sale_price = to_decimal(item.get('sale_price'))

            if not dry_run:
                prod = Product(
                    name=name,
                    slug=slug,
                    description=item.get('description', ''),
                    mrp=mrp,
                    our_price=our_price,
                    price=price,
                    sale_price=sale_price,
                    stock=item.get('stock', 0),
                    sku=item.get('sku', ''),
                    category=category,
                    meesho_url=item.get('meesho_url', ''),
                    specifications=item.get('specifications') or {},
                    is_featured=item.get('is_featured', False),
                    is_active=item.get('is_active', True),
                    approval_status=item.get('approval_status', 'approved'),
                    views=item.get('views', 0),
                    sold_count=item.get('sold_count', 0),
                    rating=to_decimal(item.get('rating')) or Decimal('0.0'),
                    review_count=item.get('review_count', 0),
                )
                # Set primary image URL as the image field value
                primary_image_url = item.get('image', '')
                if primary_image_url:
                    # Store just the relative path (after /media/)
                    if '/media/' in primary_image_url:
                        prod.image = primary_image_url.split('/media/')[-1]
                    else:
                        prod.image = primary_image_url

                # Skip slug auto-generation since we're setting it explicitly
                prod.save()

                # Restore additional product images
                for img_data in item.get('images', []):
                    img_url = img_data.get('image', '')
                    if img_url:
                        img_path = img_url.split('/media/')[-1] if '/media/' in img_url else img_url
                        ProductImage.objects.get_or_create(
                            product=prod,
                            image=img_path,
                            defaults={'is_primary': img_data.get('is_primary', False)}
                        )
                        images_created += 1

            products_created += 1
            self.stdout.write(self.style.SUCCESS(f'  [CREATE] {name}'))

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 55))
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN COMPLETE — nothing was saved'))
        else:
            self.stdout.write(self.style.SUCCESS('RESTORE COMPLETE'))
        self.stdout.write(self.style.SUCCESS('=' * 55))
        self.stdout.write(f'  Categories created : {categories_created}')
        self.stdout.write(f'  Categories existed : {categories_existing}')
        self.stdout.write(f'  Products created   : {products_created}')
        self.stdout.write(f'  Products existed   : {products_existing}')
        self.stdout.write(f'  Extra images added : {images_created}')
        self.stdout.write(f'  Total in DB now    : {Product.objects.count()} products, {Category.objects.count()} categories')
        self.stdout.write(self.style.SUCCESS('=' * 55))
