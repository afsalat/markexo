import urllib.request
import os
from api.models import Product

# Create media/products directory if it doesn't exist
os.makedirs('media/products', exist_ok=True)

# Placeholder images from picsum.photos (random images)
products = Product.objects.all()

for i, product in enumerate(products):
    try:
        # Download a random image from picsum
        img_url = f"https://picsum.photos/seed/{product.id}/400/400"
        img_path = f"products/product_{product.id}.jpg"
        full_path = f"media/{img_path}"
        
        urllib.request.urlretrieve(img_url, full_path)
        product.image = img_path
        product.save()
        print(f"Added image to: {product.name}")
    except Exception as e:
        print(f"Error for {product.name}: {e}")

print(f"Done! Added images to {products.count()} products")
