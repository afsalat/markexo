from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Product
from .google_merchant import GoogleMerchantService

@receiver(post_save, sender=Product)
def sync_product_to_google_merchant(sender, instance, created, **kwargs):
    """
    Signal to automatically sync product to Google Merchant Center when saved.
    Only syncs if the product is approved and active.
    """
    # Skip if sync is not applicable (e.g. for draft products)
    if instance.google_merchant_status == 'not_applicable':
        return

    # Check if we should sync
    if instance.approval_status == 'approved' and instance.is_active:
        # We use a simple background sync approach here. 
        # In a high-traffic production environment, this should be sent to a Celery task.
        service = GoogleMerchantService()
        if service.service:
            success, result = service.insert_product(instance)
            
            # Update sync status without triggering the signal again
            if success:
                Product.objects.filter(pk=instance.pk).update(
                    google_merchant_status='synced',
                    google_merchant_errors=None,
                    last_google_sync=timezone.now()
                )
            else:
                Product.objects.filter(pk=instance.pk).update(
                    google_merchant_status='failed',
                    google_merchant_errors=str(result)
                )
    elif not instance.is_active or instance.approval_status == 'rejected':
        # If product was previously synced but now inactive/rejected, remove it
        if instance.google_merchant_status == 'synced':
            service = GoogleMerchantService()
            if service.service:
                service.delete_product(instance)
                Product.objects.filter(pk=instance.pk).update(
                    google_merchant_status='pending',
                    last_google_sync=timezone.now()
                )
