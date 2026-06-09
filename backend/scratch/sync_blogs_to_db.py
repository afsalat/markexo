import os
import sys
import json
import django
from pathlib import Path

# Setup Django environment
sys.path.append(str(Path(__file__).resolve().parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'markexo.settings')
django.setup()

from api.models import BlogPost, Product
from django.utils.timezone import now

def sync_blogs():
    blog_json_path = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'src' / 'data' / 'blogPosts.json'
    
    if not blog_json_path.exists():
        print(f"Error: {blog_json_path} does not exist.")
        return

    with open(blog_json_path, 'r', encoding='utf-8') as f:
        blogs_data = json.load(f)

    print(f"Found {len(blogs_data)} blog posts in JSON. Synchronizing to DB...")

    for item in blogs_data:
        slug = item.get('slug')
        title = item.get('title')
        content = item.get('content')
        excerpt = item.get('excerpt', '')
        author = item.get('author', 'VorionMart Editorial')
        featured_image = item.get('featured_image', '')
        tags = item.get('tags', [])
        
        # Build meta details
        meta_title = title
        meta_description = excerpt if excerpt else title
        
        blog_post, created = BlogPost.objects.update_or_create(
            slug=slug,
            defaults={
                'title': title,
                'content': content,
                'excerpt': excerpt,
                'meta_title': meta_title,
                'meta_description': meta_description,
                'keywords': tags,
                'featured_image_url': featured_image if featured_image.startswith('http') or featured_image.startswith('/') else f"/{featured_image}",
                'author': author,
                'is_published': True,
                'ai_generated': True,
                'published_at': now()
            }
        )

        action = "Created" if created else "Updated"
        safe_title = title.encode('ascii', errors='replace').decode('ascii')
        print(f"[{action}] Blog: {safe_title} (slug: {slug})")

        # Map related products
        related_products_data = item.get('related_products', [])
        for rel_prod in related_products_data:
            prod_slug = rel_prod.get('slug')
            product = Product.objects.filter(slug=prod_slug).first()
            if product:
                blog_post.related_products.add(product)
                safe_prod_name = product.name.encode('ascii', errors='replace').decode('ascii')
                print(f"  Linked to Product: {safe_prod_name} (slug: {prod_slug})")
            else:
                print(f"  Warning: Product with slug '{prod_slug}' not found in DB.")

    print("Blog synchronization complete!")

if __name__ == '__main__':
    sync_blogs()
