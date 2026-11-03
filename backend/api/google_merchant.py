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
            import os
            from django.utils.html import strip_tags

            # Base frontend and media API hosts
            base_url = getattr(settings, 'APP_URL', 'https://vorionmart.com').rstrip('/')
            api_host = os.environ.get('PUBLIC_API_HOST', 'api.vorionmart.com')
            product_link = f"{base_url}/products/{product.slug}"

            def resolve_image_url(raw_url):
                if not raw_url:
                    return ""
                clean_str = str(raw_url).strip()
                if not clean_str:
                    return ""
                if clean_str.startswith(('http://', 'https://')):
                    if '/media/' in clean_str:
                        media_path = clean_str[clean_str.index('/media/'):]
                        return f"https://{api_host}{media_path}"
                    return clean_str
                clean_path = '/' + clean_str.lstrip('/')
                return f"https://{api_host}{clean_path}"

            # Construct primary image link
            image_link = ""
            if product.image:
                image_link = resolve_image_url(product.image.url)
            elif product.images.exists():
                primary = product.images.filter(is_primary=True).first() or product.images.first()
                if primary and primary.image:
                    image_link = resolve_image_url(primary.image.url)

            # Additional gallery images
            additional_images = []
            if product.images.exists():
                for img_obj in product.images.all()[:10]:
                    if img_obj.image:
                        img_url = resolve_image_url(img_obj.image.url)
                        if img_url and img_url != image_link and img_url not in additional_images:
                            additional_images.append(img_url)

            category_name = product.category.name if product.category else "General"
            clean_desc = strip_tags(product.description or "").strip() or product.name

            current_price = float(product.current_price or 0.0)
            mrp = float(product.mrp or 0.0)

            product_data = {
                "offerId": product.sku or str(product.id),
                "title": strip_tags(product.name or "")[:150],
                "description": clean_desc[:5000],
                "link": product_link,
                "imageLink": image_link,
                "contentLanguage": "en",
                "targetCountry": "IN",
                "channel": "online",
                "availability": "in stock" if product.stock > 0 else "out of stock",
                "condition": "new",
                "brand": "VorionMart",
                "googleProductCategory": category_name,
                "productTypes": [category_name],
                "shipping": [{
                    "country": "IN",
                    "service": "Standard Delivery",
                    "price": {
                        "value": "0.00",
                        "currency": "INR"
                    }
                }],
                "shippingWeight": {
                    "value": f"{float(product.weight_kg or 0.5):.2f}",
                    "unit": "kg"
                }
            }

            if mrp > current_price > 0:
                product_data["price"] = {
                    "value": f"{mrp:.2f}",
                    "currency": "INR"
                }
                product_data["salePrice"] = {
                    "value": f"{current_price:.2f}",
                    "currency": "INR"
                }
            else:
                product_data["price"] = {
                    "value": f"{current_price:.2f}",
                    "currency": "INR"
                }

            if additional_images:
                product_data["additionalImageLinks"] = additional_images

            if product.sku:
                product_data["mpn"] = str(product.sku)

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
