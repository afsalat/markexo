import urllib.request
import os
from api.models import Product

# Create media/products directory
os.makedirs('media/products', exist_ok=True)

# Map product names to Unsplash search terms
product_images = {
    "Wireless Bluetooth Headphones": "headphones",
    "Running Sneakers Pro": "sneakers", 
    "Smart Fitness Watch": "smartwatch",
    "Laptop Backpack": "backpack",
    "Portable Bluetooth Speaker": "speaker",
    "Yoga Mat Premium": "yoga-mat",
    "Stainless Steel Water Bottle": "water-bottle",
    "LED Desk Lamp": "desk-lamp",
    "Wireless Keyboard & Mouse": "keyboard",
    "Gaming Mouse Pad XL": "mousepad",
    "Phone Stand Holder": "phone-stand",
    "USB-C Hub Adapter": "usb-hub",
    "Noise Cancelling Earbuds": "earbuds",
    "Leather Wallet Men": "wallet",
    "Women Handbag Tote": "handbag",
    "Kids Educational Tablet": "tablet",
    "Kitchen Blender": "blender",
    "Air Purifier Mini": "air-purifier",
    "Electric Kettle 1.5L": "kettle",
    "Digital Weighing Scale": "scale",
}

for product in Product.objects.all():
    try:
        # Find matching search term
        search_term = "product"
        for name, term in product_images.items():
            if name.lower() in product.name.lower():
                search_term = term
                break
        
        # Use Unsplash Source for product images
        img_url = f"https://source.unsplash.com/400x400/?{search_term}"
        img_path = f"products/product_{product.id}.jpg"
        full_path = f"media/{img_path}"
        
        urllib.request.urlretrieve(img_url, full_path)
        product.image = img_path
        product.save()
        print(f"Added {search_term} image to: {product.name}")
    except Exception as e:
        print(f"Error for {product.name}: {e}")

print(f"\nDone! Updated images for {Product.objects.count()} products")
