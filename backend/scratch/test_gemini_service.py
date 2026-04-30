import os
import sys
import django
import json

# Setup Django environment
sys.path.append(r'c:\Users\USER\Desktop\markexo\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.ai_service import GeminiBlogService
from api.models import Product

def test_blog_gen():
    product = Product.objects.all().first()
    if not product:
        print("No products found")
        return
        
    print(f"Testing OpenRouter Master Blog Gen for: {product.name}")
    service = GeminiBlogService()
    
    # Test complete generation
    print("Generating full blog (using DeepSeek/OpenRouter)...")
    blog_data, error = service.generate_complete_blog(product)
    
    if error:
        print(f"Error: {error}")
    else:
        print("\n--- GENERATED BLOG DATA ---")
        print(f"Title: {blog_data.get('title')}")
        print(f"Slug: {blog_data.get('slug')}")
        print(f"Keywords: {blog_data.get('keywords')}")
        print(f"Content Preview: {blog_data.get('content')[:200]}...")
        print(f"FAQs Count: {len(blog_data.get('faqs', []))}")
        
        # Save sample to scratch
        with open('scratch/sample_blog.json', 'w') as f:
            json.dump(blog_data, f, indent=2)
        print("\nSample saved to scratch/sample_blog.json")

if __name__ == "__main__":
    test_blog_gen()
