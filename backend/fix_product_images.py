import os
import urllib.request
from django.core.files.base import ContentFile

from api.models import Product

products = Product.objects.filter(image='')

print(f"Found {products.count()} products missing images.")

for p in products:
    try:
        print(f"Adding placeholder image for {p.name}...")
        # Use a nice placeholder from placehold.co
        image_url = "https://placehold.co/600x600/1a1a2e/ffffff.png?text=VorionMart+Coming+Soon"
        req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        if response.getcode() == 200:
            image_name = f"{p.slug}-placeholder.png"
            p.image.save(image_name, ContentFile(response.read()), save=True)
            print(f"Saved {image_name}")
    except Exception as e:
        print(f"Error for {p.name}: {e}")

print("Done fixing images.")
