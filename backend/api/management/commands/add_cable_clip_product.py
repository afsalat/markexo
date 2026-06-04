from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Category, Product, Shop

PRODUCT_DATA = {
    "name": "Magnetic Cable Clip Organizer (Pack of 6)",
    "slug": "magnetic-cable-clip-organizer-pack-of-6-desk-wire-management-holder-for-home-office-car",
    "description": "\n".join(
        [
            "The Magnetic Cable Clip Organizer (Pack of 6) is the ultimate solution to your desk clutter and tangled wires.",
            "",
            "Key Features:",
            "- Strong Magnetic Hold: Snaps cables securely in place and releases effortlessly with a single pull.",
            "- Clean Peel & Stick Adhesive: Easily mounts to wood, glass, metal, and plastic surfaces without residue.",
            "- Prevents Tangling: Keeps cables exactly where you left them, preventing them from falling behind desks or nightstands.",
            "- Sleek & Compact: 0.5 cm ultra-thin profile sits flush against any surface.",
            "- Pack of 6: Perfect for office desk, car dashboard, bedside tables, and entertainment setup coverage.",
            "",
            "Specifications:",
            "Material: Premium ABS Plastic with Integrated Magnets",
            "Dimensions (Each): 0.5 cm x 0.5 cm x 0.5 cm",
            "Cable Compatibility: USB-A, USB-C, Lightning, Aux, Earphones, and other slim data cables",
            "Country of Origin: India",
        ]
    ),
    "supplier_price": "150.00",
    "our_price": "299.00",
    "mrp": "499.00",
    "stock": 150,
    "sku": "CABLECLIP-MAG-006",
    "meesho_url": "",
    "rating": "4.2",
    "review_count": 84,
    "specifications": {
        "material": "ABS Plastic",
        "color": "Black",
        "pack_quantity": "6 Clips",
        "mounting_type": "Self-Adhesive Peel & Stick",
        "dimensions": "0.5 cm x 0.5 cm x 0.5 cm",
        "cable_compatibility": "USB-A, USB-C, Lightning, Aux, Earphones, Data Wires",
        "country_of_origin": "India",
        "delivery": "Free Delivery in 2-3 Days",
        "assured": "100% Quality Assured",
    },
}


class Command(BaseCommand):
    help = "Add or update the Magnetic Cable Clip Organizer product in the local Markexo catalog."

    def handle(self, *args, **options):
        shop = (
            Shop.objects.filter(slug="home-essentials").first()
            or Shop.objects.filter(name__iexact="Home Essentials").first()
            or Shop.objects.filter(is_active=True).order_by("id").first()
        )
        if not shop:
            raise RuntimeError("No shop found. Create a shop first before seeding products.")

        electronics_category, _ = Category.objects.get_or_create(
            slug="electronics",
            defaults={
                "name": "Electronics",
                "description": "Electronics and gadgets",
                "is_active": True,
            },
        )

        cable_category, _ = Category.objects.get_or_create(
            slug="cable-desk-organisation",
            defaults={
                "name": "Cable & Desk Organisation",
                "description": "Premium cable managers, organizers, and desk tidying solutions",
                "parent": electronics_category,
                "is_active": True,
            },
        )
        if cable_category.parent_id != electronics_category.id or not cable_category.is_active:
            cable_category.parent = electronics_category
            cable_category.is_active = True
            cable_category.save(update_fields=["parent", "is_active"])

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
                "category": cable_category,
                "meesho_url": PRODUCT_DATA["meesho_url"],
                "specifications": PRODUCT_DATA["specifications"],
                "is_featured": True,
                "is_active": True,
                "approval_status": "approved",
                "rating": PRODUCT_DATA["rating"],
                "review_count": PRODUCT_DATA["review_count"],
            },
        )

        # Set image
        relative_path = "products/magnetic-cable-clip-organizer-pack-of-6.png"
        product.image.name = relative_path
        product.save(update_fields=["image", "updated_at"])

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} {product.name}"))
        self.stdout.write(self.style.SUCCESS(f"Shop: {shop.name}"))
        self.stdout.write(self.style.SUCCESS(f"Category: {cable_category.name}"))
