import logging
from django.conf import settings
from googleapiclient.discovery import build
from google.oauth2 import service_account

logger = logging.getLogger('api')

class GoogleMerchantService:
    """Service to handle interactions with Google Content API for Shopping."""
    
    def __init__(self):
        self.merchant_id = getattr(settings, 'GOOGLE_MERCHANT_ID', None)
        self.credentials_file = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
        self.scopes = ['https://www.googleapis.com/auth/content']
        
        if not self.merchant_id or not self.credentials_file:
            logger.warning("Google Merchant ID or Service Account file not configured.")
            self.service = None
            return

        try:
            self.credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file, scopes=self.scopes
            )
            self.service = build('content', 'v2.1', credentials=self.credentials)
        except Exception as e:
            logger.error(f"Failed to initialize Google Merchant Service: {e}")
            self.service = None

    def insert_product(self, product):
        """Insert or update a product in Google Merchant Center."""
        if not self.service:
            return False, "Service not initialized"

        try:
            # Construct links
            # settings.APP_URL should be the frontend base URL (e.g., https://vorionmart.com)
            base_url = getattr(settings, 'APP_URL', 'https://vorionmart.com').rstrip('/')
            product_link = f"{base_url}/products/{product.slug}"
            
            # Construct image link
            image_link = ""
            if product.image:
                # settings.BACKEND_ORIGIN should be the backend base URL (e.g., https://api.vorionmart.com)
                backend_base = getattr(settings, 'BACKEND_ORIGIN', base_url).rstrip('/')
                image_link = f"{backend_base}{product.image.url}"
            elif product.images.exists():
                primary = product.images.filter(is_primary=True).first() or product.images.first()
                backend_base = getattr(settings, 'BACKEND_ORIGIN', base_url).rstrip('/')
                image_link = f"{backend_base}{primary.image.url}"

            product_data = {
                "offerId": product.sku or str(product.id),
                "title": product.name,
                "description": product.description[:5000], # Google limit is 5000 chars
                "link": product_link,
                "imageLink": image_link,
                "contentLanguage": "en",
                "targetCountry": "IN",
                "channel": "online",
                "availability": "in stock" if product.stock > 0 else "out of stock",
                "condition": "new",
                "price": {
                    "value": str(product.current_price),
                    "currency": "INR"
                },
                "brand": "VorionMart", # You might want to make this dynamic
                "googleProductCategory": product.category.name if product.category else "General",
            }

            request = self.service.products().insert(merchantId=self.merchant_id, body=product_data)
            response = request.execute()
            
            logger.info(f"Successfully synced product {product.name} to Google Merchant Center.")
            return True, response

        except Exception as e:
            error_msg = f"Error syncing product {product.id} to Google Merchant: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def delete_product(self, product):
        """Remove a product from Google Merchant Center."""
        if not self.service:
            return False, "Service not initialized"

        try:
            # Product ID in Merchant Center is usually: channel:contentLanguage:targetCountry:offerId
            offer_id = product.sku or str(product.id)
            product_id = f"online:en:IN:{offer_id}"
            
            request = self.service.products().delete(merchantId=self.merchant_id, productId=product_id)
            request.execute()
            
            logger.info(f"Successfully deleted product {product.name} from Google Merchant Center.")
            return True, None
        except Exception as e:
            error_msg = f"Error deleting product {product.id} from Google Merchant: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
