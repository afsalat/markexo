import os
import sys
import django

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
        
    print(f"Testing blog gen for: {product.name}")
    service = GeminiBlogService()
    
    # Test plan (Keywords + Outline)
    print("Generating SEO plan (Keywords + Outline)...")
    plan, error = service.generate_keywords_and_outline(product)
    if error:
        print(f"Plan Error: {error}")
        return
    else:
        print(f"Plan Title: {plan.get('title')}")
        print(f"Keywords: {plan.get('keywords')}")

    # Test full content
    print("Generating full content (this will take a while)...")
    content, error = service.generate_full_content(product, plan)
    if error:
        print(f"Content Error: {error}")
    else:
        print(f"Content Length: {len(content)} characters")
        print("First 100 chars:", content[:100])

if __name__ == "__main__":
    test_blog_gen()
