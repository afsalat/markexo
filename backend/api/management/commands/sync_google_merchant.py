from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Product
from api.google_merchant import GoogleMerchantService

class Command(BaseCommand):
    help = 'Synchronizes all approved and active products to Google Merchant Center'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync all products regardless of their current status',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        products = Product.objects.filter(approval_status='approved', is_active=True)
        if not force:
            # By default only sync products that haven't been synced or failed
            products = products.exclude(google_merchant_status='synced')

        self.stdout.write(f"Found {products.count()} products to sync.")
        
        service = GoogleMerchantService()
        if not service.service:
            self.stderr.write("Google Merchant Service not initialized. Check your settings and service-account.json.")
            return

        success_count = 0
        fail_count = 0

        for product in products:
            self.stdout.write(f"Syncing {product.name}...")
            success, result = service.insert_product(product)
            
            if success:
                product.google_merchant_status = 'synced'
                product.google_merchant_errors = None
                product.last_google_sync = timezone.now()
                product.save(update_fields=['google_merchant_status', 'google_merchant_errors', 'last_google_sync'])
                success_count += 1
            else:
                product.google_merchant_status = 'failed'
                product.google_merchant_errors = str(result)
                product.save(update_fields=['google_merchant_status', 'google_merchant_errors'])
                fail_count += 1
                self.stderr.write(f"Failed to sync {product.name}: {result}")

        self.stdout.write(self.style.SUCCESS(f"Sync completed. Successfully synced: {success_count}, Failed: {fail_count}"))
