from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from api.models import Category, Product, ProductImage, Shop


PRODUCT_DATA = {
    "name": "Divik's Men's Cotton Printed Full Sleeve Checkered Shirts - Green",
    "slug": "diviks-mens-cotton-printed-full-sleeve-checkered-shirts-green",
    "description": "\n".join(
        [
            "Divik's men's cotton printed full sleeve checkered shirts.",
            "",
            "Fabric: Cotton",
            "Sleeve Length: Long Sleeves",
            "Pattern: Printed",
            "Color: Green",
            "Fit/Shape: Regular",
            "Length: Regular",
            "Neck: Contrast Collar",
            "Print or Pattern Type: Floral",
            "Occasion: Formal",
            "Hemline: Curved",
            "Number of Pockets: 1",
            "Net Quantity: 1",
            "Supplier: HKG ENTERPRISES",
            "Country of Origin: India",
        ]
    ),
    "supplier_price": "357.00",
    "our_price": "357.00",
    "mrp": "599.00",
    "stock": 25,
    "sku": "GVZ6X-DIVIKS-GREEN",
    "meesho_url": "https://www.meesho.com/diviks-mens-cotton-printed-full-sleeve-checkered-shirts-green/p/gvz6x",
    "rating": "4.0",
    "review_count": 3701,
    "image_urls": [
        "https://images.meesho.com/images/products/28365801/5d65k_512.jpg",
        "https://images.meesho.com/images/products/28365801/rvy7d_512.jpg",
        "https://images.meesho.com/images/products/28365801/eucrf_512.jpg",
        "https://images.meesho.com/images/products/28365801/yut8s_512.jpg",
    ],
    "specifications": {
        "product_id": "gvz6x",
        "fabric": "Cotton",
        "color": "Green",
        "fit_shape": "Regular",
        "length": "Regular",
        "neck": "Contrast Collar",
        "sleeve_length": "Long Sleeves",
        "sleeve_styling": "Regular",
        "pattern": "Printed",
        "print_or_pattern_type": "Floral",
        "occasion": "Formal",
        "hemline": "Curved",
        "number_of_pockets": "1",
        "net_quantity": "1",
        "supplier_name": "HKG ENTERPRISES",
        "country_of_origin": "India",
        "rating_score": "4.0",
        "rating_count": "8463",
        "review_count": "3701",
        "available_sizes": "M, L, XL, XXL, XXXL",
        "size_chart": "M: Chest 40 in / Length 28.5 in | L: Chest 42 in / Length 29 in | XL: Chest 44 in / Length 30 in | XXL: Chest 47 in / Length 30.5 in | XXXL: Chest 49 in / Length 32 in",
        "delivery": "Free Delivery by Wednesday, 25 Mar",
        "assured": "Best quality products from trusted suppliers.",
    },
}


class Command(BaseCommand):
    help = "Add or update the Divik's shirt product in the local Markexo catalog."

    def handle(self, *args, **options):
        shop = (
            Shop.objects.filter(slug="fashion-forward").first()
            or Shop.objects.filter(name__iexact="Fashion Forward").first()
            or Shop.objects.filter(is_active=True).order_by("id").first()
        )
        if not shop:
            raise RuntimeError("No shop found. Create a shop first before seeding products.")

        fashion_category, _ = Category.objects.get_or_create(
            slug="fashion",
            defaults={
                "name": "Fashion",
                "description": "Fashion products",
                "is_active": True,
            },
        )

        men_category, _ = Category.objects.get_or_create(
            slug="fashion-men-wear",
            defaults={
                "name": "Men Wear",
                "description": "Men's clothing and apparel",
                "parent": fashion_category,
                "is_active": True,
            },
        )
        if men_category.parent_id != fashion_category.id or not men_category.is_active:
            men_category.parent = fashion_category
            men_category.is_active = True
            men_category.save(update_fields=["parent", "is_active"])

        shirts_category, _ = Category.objects.get_or_create(
            slug="fashion-men-wear-shirts",
            defaults={
                "name": "Shirts",
                "description": "Formal and casual shirts for men",
                "parent": men_category,
                "is_active": True,
            },
        )
        if shirts_category.parent_id != men_category.id or not shirts_category.is_active:
            shirts_category.parent = men_category
            shirts_category.is_active = True
            shirts_category.save(update_fields=["parent", "is_active"])

        product, created = Product.objects.update_or_create(
            slug=PRODUCT_DATA["slug"],
            defaults={
                "name": PRODUCT_DATA["name"],
                "description": PRODUCT_DATA["description"],
                "mrp": PRODUCT_DATA["mrp"],
                "supplier_price": PRODUCT_DATA["supplier_price"],
                "our_price": PRODUCT_DATA["our_price"],
                "price": PRODUCT_DATA["our_price"],
                "sale_price": PRODUCT_DATA["our_price"],
                "stock": PRODUCT_DATA["stock"],
                "sku": PRODUCT_DATA["sku"],
                "shop": shop,
                "category": shirts_category,
                "meesho_url": PRODUCT_DATA["meesho_url"],
                "specifications": PRODUCT_DATA["specifications"],
                "is_featured": False,
                "is_active": True,
                "approval_status": "approved",
                "rating": PRODUCT_DATA["rating"],
                "review_count": PRODUCT_DATA["review_count"],
            },
        )

        self._sync_images(product)

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} {product.name}"))
        self.stdout.write(self.style.SUCCESS(f"Shop: {shop.name}"))
        self.stdout.write(self.style.SUCCESS(f"Category: {shirts_category.name}"))

    def _sync_images(self, product):
        image_urls = PRODUCT_DATA["image_urls"]
        main_image_name = self._download_image(product.slug, image_urls[0], "main")
        if main_image_name:
            product.image.name = main_image_name
            product.save(update_fields=["image", "updated_at"])

        ProductImage.objects.filter(product=product).delete()
        for index, image_url in enumerate(image_urls[1:], start=1):
            image_name = self._download_image(product.slug, image_url, f"gallery-{index}")
            if not image_name:
                continue
            ProductImage.objects.create(
                product=product,
                image=image_name,
                is_primary=False,
            )

    def _download_image(self, slug, image_url, suffix):
        try:
            request = Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(request, timeout=30) as response:
                content = response.read()
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"Failed to download {image_url}: {exc}"))
            return None

        extension = Path(urlparse(image_url).path).suffix or ".jpg"
        file_name = f"{slug}-{suffix}{extension}"
        relative_path = f"products/{file_name}"
        content_file = ContentFile(content)

        if default_storage.exists(relative_path):
            default_storage.delete(relative_path)
        default_storage.save(relative_path, content_file)
        return relative_path
