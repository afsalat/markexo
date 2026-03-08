import os
import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from api.models import Product, Shop, Category, Partner, Banner, SiteSetting, ProductImage
from urllib.parse import urlparse

class Command(BaseCommand):
    help = 'Standardizes image paths in the database and moves physical files to correct media subfolders.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting image standardization..."))

        self.standardize_products()
        self.standardize_shops()
        self.standardize_partners()
        self.standardize_categories()
        # Add others if needed in the future

        self.stdout.write(self.style.SUCCESS("Image standardization completed!"))

    def _process_image_field(self, obj, image_field_name, upload_to_folder, external_url=None):
        """
        1. If local image exists but is in the wrong path, move it. (We'll mostly handle this by simply pointing it correctly if it exists physically but Db path is wrong, though usually Django handles this. However, if they have 'media/image.png' in DB we need to strip 'media/'.)
        2. If local image doesn't exist but external URL does, download it.
        """
        image_field = getattr(obj, image_field_name)
        
        # Scenario 1: Needs downloading from external URL
        if not image_field and external_url:
            self.stdout.write(f"Downloading image from external URL for {obj}...")
            try:
                response = requests.get(external_url, timeout=10)
                if response.status_code == 200:
                    # Extract filename from URL or use a generic one
                    path = urlparse(external_url).path
                    ext = os.path.splitext(path)[1]
                    if not ext:
                        ext = '.jpg' # default fallback
                    filename = f"downloaded_{obj.pk}{ext}"
                    
                    image_field.save(filename, ContentFile(response.content), save=False)
                    obj.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully downloaded and saved: {image_field.name}"))
                    return
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Failed to download image for {obj}: {e}"))

        # Scenario 2: Fix wrongly formatted DB paths (e.g., 'media/products/img.png' instead of 'products/img.png' or 'img.png' instead of 'products/img.png')
        if image_field:
            current_name = image_field.name
            
            # Remove leading 'media/' if accidentally stored
            if current_name.startswith('media/'):
                current_name = current_name.replace('media/', '', 1)
            elif current_name.startswith('/media/'):
                current_name = current_name.replace('/media/', '', 1)

            # Check if it lacks the subfolder prefix
            if not current_name.startswith(upload_to_folder):
                 # It might literally be in the root media folder physically.
                 old_physical_path = os.path.join(settings.MEDIA_ROOT, current_name)
                 new_db_name = os.path.join(upload_to_folder, os.path.basename(current_name)).replace('\\', '/')
                 new_physical_path = os.path.join(settings.MEDIA_ROOT, new_db_name)

                 if os.path.exists(old_physical_path) and not os.path.exists(new_physical_path):
                     # Ensure directory exists
                     os.makedirs(os.path.dirname(new_physical_path), exist_ok=True)
                     # Move physical file
                     try:
                         os.rename(old_physical_path, new_physical_path)
                         self.stdout.write(f"Moved physical file to {new_physical_path}")
                     except Exception as e:
                         self.stdout.write(self.style.WARNING(f"Could not move physical file: {e}"))

                 # Update DB Link specifically
                 setattr(obj, image_field_name, new_db_name)
                 obj.save()
                 self.stdout.write(self.style.SUCCESS(f"Updated DB link for {obj} to {new_db_name}"))
                 return

            # If it already started with media/ we need to save the stripped version
            if current_name != image_field.name:
                setattr(obj, image_field_name, current_name)
                obj.save()
                self.stdout.write(self.style.SUCCESS(f"Stripped leading media/ from {obj} : {current_name}"))


    def standardize_products(self):
        self.stdout.write("Standardizing Products...")
        products = Product.objects.all()
        for p in products:
            self._process_image_field(p, 'image', 'products/', external_url=p.meesho_url)
            
        self.stdout.write("Standardizing Product Images...")
        for pi in ProductImage.objects.all():
             self._process_image_field(pi, 'image', 'products/')

    def standardize_shops(self):
        self.stdout.write("Standardizing Shops...")
        for s in Shop.objects.all():
            self._process_image_field(s, 'image', 'shops/')

    def standardize_partners(self):
        self.stdout.write("Standardizing Partners...")
        for p in Partner.objects.all():
            self._process_image_field(p, 'profile_image', 'partners/')
            
    def standardize_categories(self):
        self.stdout.write("Standardizing Categories...")
        for c in Category.objects.all():
            self._process_image_field(c, 'image', 'categories/')
