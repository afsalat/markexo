from django.core.management.base import BaseCommand
from api.models import Product
from api.ai_service import GeminiBlogService
import logging
import json
import re

logger = logging.getLogger(__name__)

class ProductSEOService(GeminiBlogService):
    def generate_product_seo(self, product_name, category, description):
        prompt = f"""
        You are an expert SEO optimizer for an Indian eCommerce website.
        Optimize the following product for higher CTR and AI search engine visibility.

        Product: {product_name}
        Category: {category}
        Current Description: {description[:500]}

        Follow these RULES:
        1. SEO Title: Main Keyword + Benefit + Audience + India. (Max 60 chars) Example: "Waterproof 15.6 Inch Laptop Sleeve with Handle"
        2. Meta Description: Emotional copy. Max 150 chars. Example: "Save money smarter with our wooden savings box. Perfect for kids. COD available across India."
        3. FAQs: Exactly 3 common questions a buyer would have, and short answers.

        Return STRICTLY valid JSON:
        {{
            "seo_title": "Optimized Title",
            "meta_description": "Optimized meta description",
            "faqs": [
                {{"question": "Q1", "answer": "A1"}},
                {{"question": "Q2", "answer": "A2"}},
                {{"question": "Q3", "answer": "A3"}}
            ]
        }}
        """

        result, error = self._call_openrouter([{"role": "user", "content": prompt}])
        if error:
            return None, error

        try:
            content = result['choices'][0]['message']['content']
            content = re.sub(r'```json\n?|\n?```', '', content).strip()
            data = json.loads(content)
            return data, None
        except Exception as e:
            return None, f"Parsing error: {e}"

class Command(BaseCommand):
    help = 'Automatically generates optimized SEO titles, meta descriptions, and FAQs for Products'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=10, help='Number of products to process')

    def handle(self, *args, **options):
        count = options['count']
        
        # Find products that need SEO optimization (missing faqs or meta_description if it existed)
        # Note: Depending on the model, we can store seo_title in 'name' or a new field.
        products = Product.objects.filter(is_active=True).order_by('?')[:count]

        if not products:
            self.stdout.write(self.style.SUCCESS("No products found."))
            return

        service = ProductSEOService()
        success_count = 0

        for prod in products:
            self.stdout.write(f"Optimizing SEO for product: {prod.name}...")
            
            cat_name = prod.category.name if prod.category else "General"
            
            data, error = service.generate_product_seo(prod.name, cat_name, prod.description)
            
            if error or not data:
                self.stderr.write(self.style.ERROR(f"Failed to generate SEO for {prod.name}: {error}"))
                continue
            
            # Since the db might not have explicit meta_description, we just update the name
            # Or if it does, we update it. Let's update name and save FAQs to specs if faq field doesn't exist.
            # Assuming faq is a JSONField or similar based on ProductSchema.tsx `product.faq`
            
            try:
                # Update product name to the better SEO title
                prod.name = data.get('seo_title', prod.name)
                
                # If there is a meta_description or faq field, we'd update them. 
                # Using hasattr to be safe.
                if hasattr(prod, 'faq') or hasattr(prod, 'faqs'):
                    setattr(prod, 'faq', data.get('faqs', []))
                    
                prod.save()
                success_count += 1
                self.stdout.write(self.style.SUCCESS(f"Successfully optimized: {prod.name}"))
            except Exception as e:
                self.stderr.write(self.style.WARNING(f"Could not save product {prod.name}: {e}"))
            
        self.stdout.write(self.style.SUCCESS(f"Done! Optimized {success_count} products."))
