from django.core.management.base import BaseCommand
from api.models import Category
from api.ai_service import GeminiBlogService
import logging
import json
import re
import urllib.request
from django.core.files.base import ContentFile
from urllib.error import URLError

logger = logging.getLogger(__name__)

class CategorySEOService(GeminiBlogService):
    def generate_category_content(self, category_name):
        prompt = f"""
        You are an expert SEO content writer for an eCommerce website called VorionMart (https://vorionmart.com).
        Write a high-quality, human-like, and VERY DETAILED category description for the category "{category_name}".
        
        The description MUST be 400-800 words and be formatted in HTML. It should be structured to improve SEO and conversion.
        
        Include the following sections using proper HTML tags (<h2>, <h3>, <ul>, <p>):
        1. Intro paragraph (hooking the shopper)
        2. Types of {category_name} available
        3. Benefits of buying from VorionMart
        4. Usage Guide / Tips
        5. FAQs (at least 3 questions and answers)
        6. Related searches / keywords integrated naturally

        Return STRICTLY valid JSON with no markdown blocks:
        {{
            "description_html": "HTML content here"
        }}
        """

        result, error = self._call_openrouter([{"role": "user", "content": prompt}])
        if error:
            return None, error

        try:
            content = result['choices'][0]['message']['content']
            content = re.sub(r'```json\n?|\n?```', '', content).strip()
            data = json.loads(content)
            return data.get('description_html'), None
        except Exception as e:
            return None, f"Parsing error: {e}"

class Command(BaseCommand):
    help = 'Automatically generates SEO descriptions and placeholder images for Categories'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=10, help='Number of categories to process')

    def handle(self, *args, **options):
        count = options['count']
        
        categories = Category.objects.filter(description="").order_by('?')[:count]
        
        if not categories:
            self.stdout.write(self.style.SUCCESS("All categories already have descriptions."))
            return

        service = CategorySEOService()
        success_count = 0

        for cat in categories:
            self.stdout.write(f"Generating content for category: {cat.name}...")
            
            # Generate Text
            description, error = service.generate_category_content(cat.name)
            
            if error or not description:
                self.stderr.write(self.style.ERROR(f"Failed to generate text for {cat.name}: {error}"))
                continue
                
            cat.description = description
            
            # Generate Image (Using Unsplash Source API)
            if not cat.image:
                try:
                    self.stdout.write(f"Fetching Unsplash image for {cat.name}...")
                    clean_name = urllib.parse.quote(cat.name.replace(' ', ','))
                    image_url = f"https://source.unsplash.com/800x400/?{clean_name}"
                    req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
                    response = urllib.request.urlopen(req)
                    if response.getcode() == 200:
                        image_name = f"{cat.slug}-banner.jpg"
                        cat.image.save(image_name, ContentFile(response.read()), save=False)
                except Exception as e:
                    self.stderr.write(self.style.WARNING(f"Could not fetch image for {cat.name}: {e}"))
            
            cat.save()
            success_count += 1
            self.stdout.write(self.style.SUCCESS(f"Successfully updated category: {cat.name}"))
            
        self.stdout.write(self.style.SUCCESS(f"Done! Updated {success_count} categories."))
