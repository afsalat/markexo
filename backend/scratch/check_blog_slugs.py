import os
import json

with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)
products_slugs = {p.get('slug') for p in products if p.get('slug')}

with open('frontend/src/data/blogPosts.json', 'r', encoding='utf-8') as f:
    blog_posts = json.load(f)

blog_slugs = []
for post in blog_posts:
    url = post.get('url', '')
    if '/products/' in url:
        slug = url.split('/products/')[-1]
        blog_slugs.append(slug)
    # also check references inside content
    content = post.get('content', '')
    import re
    urls = re.findall(r'/products/([a-zA-Z0-9_-]+)', content)
    blog_slugs.extend(urls)

blog_slugs = set(blog_slugs)

print("Slugs referenced in blogPosts.json:")
for s in sorted(blog_slugs):
    in_json = s in products_slugs
    print(f"Slug: {s}, In products.json: {in_json}")
