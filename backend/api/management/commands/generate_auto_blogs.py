from django.core.management.base import BaseCommand
from api.models import Product, BlogPost
from api.ai_service import GeminiBlogService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Automatically generates SEO blog posts for products using Gemini AI'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=3, help='Number of blogs to generate')

    def handle(self, *args, **options):
        count = options['count']
        self.stdout.write(f"Starting auto-generation of {count} blog posts...")
        
        # Get products that don't have a related blog post yet
        products = Product.objects.filter(is_active=True, approval_status='approved').exclude(
            blog_posts__isnull=False
        ).order_by('?')[:count]
        
        if not products:
            self.stdout.write(self.style.SUCCESS("No products found that need blog posts."))
            return

        ai_service = GeminiBlogService()
        generated_count = 0

        for product in products:
            self.stdout.write(f"Generating blog for: {product.name}")
            blog_data, error = ai_service.generate_complete_blog(product)
            
            if error:
                self.stderr.write(self.style.ERROR(f"Error generating blog for {product.name}: {error}"))
                continue
            
            try:
                blog_post = BlogPost.objects.create(
                    title=blog_data['title'],
                    content=blog_data['content'],
                    excerpt=blog_data['excerpt'],
                    meta_title=blog_data['title'],
                    meta_description=blog_data['meta_description'],
                    keywords=blog_data['keywords'],
                    ai_generated=True,
                    is_published=True
                )
                blog_post.related_products.add(product)
                generated_count += 1
                self.stdout.write(self.style.SUCCESS(f"Successfully generated blog: {blog_post.title}"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error saving blog post: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Done! Generated {generated_count} blog posts."))
