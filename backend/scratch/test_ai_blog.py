import os
import sys
import django
import json

# Setup Django environment
sys.path.append('c:\\Users\\USER\\Desktop\\markexo\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import Product
from api.ai_service import GeminiBlogService

def test_blog_generation():
    print("Starting AI Blog Generation Test...")
    
    # Get a product to test with
    product = Product.objects.first()
    if not product:
        print("No products found in database. Please add a product first.")
        return

    print(f"Testing with product: {product.name} (ID: {product.id})")
    
    service = GeminiBlogService()
    print(f"Using service: {service.__class__.__name__}")
    print(f"Target URL: {service.url}")
    print(f"Primary Model: {service.model}")
    
    blog_data, error = service.generate_complete_blog(product)
    
    if error:
        print(f"\n❌ FAILED: {error}")
    else:
        print("\n✅ SUCCESS!")
        print(f"Title: {blog_data.get('title')}")
        print(f"Slug: {blog_data.get('slug')}")
        print(f"Word Count (approx): {len(blog_data.get('content', '').split())}")
        print(f"Keywords: {blog_data.get('keywords')}")
        
        # Save to file for inspection
        with open('scratch/test_blog_output.json', 'w') as f:
            json.dump(blog_data, f, indent=2)
        print("\nFull output saved to scratch/test_blog_output.json")

if __name__ == "__main__":
    test_blog_generation()
