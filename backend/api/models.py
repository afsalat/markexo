"""
Database models for VorionMart marketplace.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


def generate_unique_slug(model_class, name, instance_id=None, max_length=200):
    base_slug = slugify(name) or 'item'
    base_slug = base_slug[:max_length].strip('-') or 'item'
    slug = base_slug
    counter = 2

    while True:
        queryset = model_class.objects.filter(slug=slug)
        if instance_id is not None:
            queryset = queryset.exclude(pk=instance_id)
        if not queryset.exists():
            return slug

        suffix = f"-{counter}"
        trimmed_base = base_slug[: max_length - len(suffix)].rstrip('-') or 'item'
        slug = f"{trimmed_base}{suffix}"
        counter += 1


class Shop(models.Model):
    """Source shop / vendor registry used for product sourcing and payment tracking."""
    SHOP_TYPE_CHOICES = [
        ('b2b_ecommerce', 'Online B2B E-commerce Store'),
        ('local_shop', 'Local Shop'),
        ('single_product_wholesaler', 'Single Product Wholesaler'),
        ('multi_product_seller', 'Multiple Product Seller'),
        ('retailer', 'Retailer'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    shop_type = models.CharField(max_length=30, choices=SHOP_TYPE_CHOICES, default='other')
    source_platform = models.CharField(max_length=100, blank=True, help_text="e.g. IndiaMART, Meesho, Shopify, local market")
    website_url = models.URLField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    image = models.ImageField(upload_to='shops/', blank=True, null=True)
    image = models.ImageField(upload_to='shops/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Legacy partner ownership fields retained for backward compatibility.
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=50.00, help_text="Percentage of profit shared with the partner (0-100)")
    sourcing_partner = models.ForeignKey(
        'Partner',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sourced_shops',
        help_text="Partner who sourced or onboarded this shop",
    )
    sourcing_partners = models.ManyToManyField(
        'Partner',
        blank=True,
        related_name='attributed_shops',
        help_text="All partners involved in sourcing this shop",
    )
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Shop, self.name, instance_id=self.pk, max_length=200)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Partner(models.Model):
    """Partner/Employee model - workers assigned to shops."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner_profile')
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    
    # Personal Info
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    profile_image = models.ImageField(upload_to='partners/', blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Employment Details
    date_of_joining = models.DateField(auto_now_add=True)
    designation = models.CharField(max_length=100, default='Product Manager')
    assigned_shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, null=True, blank=True, related_name='partners')
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, help_text="Commission percentage (0-100)")
    
    # Banking Details for Payouts
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True)
    upi_id = models.CharField(max_length=100, blank=True)
    pan_number = models.CharField(max_length=20, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, help_text="Admin notes about this partner")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Generate employee ID like EMP001, EMP002, etc.
            last_partner = Partner.objects.order_by('-id').first()
            if last_partner:
                last_num = int(last_partner.employee_id.replace('EMP', '') or 0)
                self.employee_id = f'EMP{str(last_num + 1).zfill(3)}'
            else:
                self.employee_id = 'EMP001'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.employee_id})"

    class Meta:
        ordering = ['-created_at']



class Category(models.Model):
    """Product category model."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Category, self.name, instance_id=self.pk, max_length=200)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']


class Product(models.Model):
    """Product model."""
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField()
    
    # Dropshipping Pricing Structure
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0, help_text="Maximum Retail Price")
    supplier_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0, help_text="Price from Meesho/Supplier")
    our_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0, help_text="Our Selling Price to Customer")
    
    # Legacy fields (kept for backward compatibility, can be removed later)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True)
    shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    meesho_url = models.URLField(blank=True, help_text="Internal reference for sourcing")
    specifications = models.JSONField(default=dict, blank=True, help_text="Key-value pairs for product specs")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='approved')

    views = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        # Auto-activate/deactivate based on approval status
        if self.approval_status == 'approved':
            self.is_active = True
        elif self.approval_status == 'rejected':
            self.is_active = False
        super().save(*args, **kwargs)

    @property
    def current_price(self):
        """Customer pays this price"""
        if self.our_price:
            return self.our_price
        # Fallback to legacy pricing
        return self.sale_price if self.sale_price else (self.price or 0)

    @property
    def discount_percent(self):
        """Discount from MRP"""
        if self.mrp and self.our_price and self.mrp > 0:
            return int(((self.mrp - self.our_price) / self.mrp) * 100)
        return 0
    
    @property
    def profit_margin(self):
        """Our profit per unit"""
        if self.our_price and self.supplier_price:
            return self.our_price - self.supplier_price
        return 0
    
    @property
    def profit_percent(self):
        """Profit percentage"""
        if self.supplier_price and self.supplier_price > 0:
            return int((self.profit_margin / self.supplier_price) * 100)
        return 0

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class ProductImage(models.Model):
    """Additional product images."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product.name}"





class Customer(models.Model):
    """Customer profile model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    soft_block = models.BooleanField(default=False, help_text="Flag for potential RTO/Fraud")
    order_count = models.PositiveIntegerField(default=0, help_text="Total orders placed")
    successful_deliveries = models.PositiveIntegerField(default=0, help_text="Total delivered orders")
    rto_count = models.PositiveIntegerField(default=0, help_text="Total RTOs")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    """Order model."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('pending_verification', 'Pending Verification'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('ordered_from_meesho', 'Ordered from Meesho'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('rto', 'Returned to Origin (RTO)'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned (Customer)'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending_cod', 'Pending COD Collection'),
        ('pending', 'Pending'),
        ('received', 'Payment Received'),
        ('received_from_meesho', 'Received from Meesho'),
        ('paid', 'Paid'),
        ('failed_rto', 'Failed (RTO)'),
        ('refunded', 'Refunded'),
    ]

    REFUND_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('refunded', 'Refunded'),
        ('not_applicable', 'Not Applicable'),
    ]

    order_id = models.CharField(max_length=20, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='pending_cod')
    is_cod = models.BooleanField(default=True)
    meesho_order_id = models.CharField(max_length=50, blank=True, help_text="Supplier Order ID")
    
    refund_status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='not_applicable')
    cancellation_reason = models.TextField(blank=True)
    delivery_address = models.TextField()
    delivery_city = models.CharField(max_length=100)
    delivery_pincode = models.CharField(max_length=10)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_id:
            import random
            import string
            self.order_id = 'AGV' + ''.join(random.choices(string.digits, k=8))
        
        # Track status changes
        is_new = self.pk is None
        old_status = None
        
        if not is_new:
            try:
                old_instance = Order.objects.get(pk=self.pk)
                old_status = old_instance.status
            except Order.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Create status history entry if status changed or new order
        if is_new or (old_status and old_status != self.status):
            # Import here to avoid circular import
            from api.models import OrderStatusHistory
            OrderStatusHistory.objects.create(order=self, status=self.status)

    def __str__(self):
        return self.order_id

    class Meta:
        ordering = ['-created_at']


class OrderStatusHistory(models.Model):
    """Tracks order status changes with timestamps."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.order.order_id} → {self.status} at {self.changed_at}"

    class Meta:
        ordering = ['changed_at']
        verbose_name_plural = 'Order Status Histories'


class OrderItem(models.Model):
    """Order item model."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=300)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)


    @property
    def total(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"


class Banner(models.Model):
    """Homepage banner model."""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to='banners/')
    link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['order']


class SiteSetting(models.Model):
    """Site settings model."""
    site_name = models.CharField(max_length=200, default='VorionMart')
    site_tagline = models.CharField(max_length=300, blank=True)
    logo = models.ImageField(upload_to='site/', blank=True, null=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)


    def __str__(self):
        return self.site_name

    class Meta:
        verbose_name = 'Site Setting'
        verbose_name_plural = 'Site Settings'


class Enquiry(models.Model):
    """Customer enquiry model."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('responded', 'Responded'),
    ]

    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=300)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"

    class Meta:
        ordering = ['-created_at']


class Cart(models.Model):
    """Shopping cart model for authenticated users."""
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.customer.name}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def total_amount(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    """Cart item model."""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['cart', 'product']

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def subtotal(self):
        return self.product.current_price * self.quantity


class Supplier(models.Model):
    """Supplier directory entry with optional API integration details."""
    SUPPLIER_TYPE_CHOICES = [
        ('local_shop', 'Local Shop'),
        ('ecommerce', 'E-commerce Website'),
        ('social', 'Online Social Supplier'),
        ('marketplace', 'Marketplace Seller'),
        ('wholesale', 'Wholesale Supplier'),
        ('manufacturer', 'Manufacturer'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100)
    supplier_type = models.CharField(max_length=20, choices=SUPPLIER_TYPE_CHOICES, default='other')
    source_platform = models.CharField(max_length=100, blank=True, help_text="e.g. Meesho, IndiaMART, Instagram, Shopify")
    website_url = models.URLField(blank=True)
    store_url = models.URLField(blank=True, help_text="Direct store, catalog, or profile URL")
    contact_person = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    instagram_handle = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    api_endpoint = models.URLField(blank=True)
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    webhook_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    auto_send = models.BooleanField(default=False, help_text="Automatically forward confirmed orders")
    orders_sent = models.PositiveIntegerField(default=0)
    success_rate = models.PositiveIntegerField(default=0)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class OrderForwardLog(models.Model):
    """Tracks order forwarding attempts to suppliers."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('acknowledged', 'Acknowledged'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='forward_logs')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='forward_logs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    request_data = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
    response_message = models.TextField(blank=True)
    supplier_order_id = models.CharField(max_length=100, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.order.order_id} → {self.supplier.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Forward Log'
        verbose_name_plural = 'Order Forward Logs'


class Review(models.Model):
    """Product review model."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'customer']
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.customer.name} for {self.product.name}"

    def save(self, *args, **kwargs):
        # Check if customer has purchased this product
        from django.db.models import Exists, OuterRef
        has_purchased = Order.objects.filter(
            customer=self.customer,
            items__product=self.product,
            status__in=['delivered', 'completed']
        ).exists()
        self.verified = has_purchased
        super().save(*args, **kwargs)

        # Update product's rating and review count
        self.product.rating = self.product.reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
        self.product.review_count = self.product.reviews.count()
        self.product.save(update_fields=['rating', 'review_count'])


class ReviewImage(models.Model):
    """Images attached to a product review."""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for review {self.review_id}"

    class Meta:
        ordering = ['created_at', 'id']

class PayoutRequest(models.Model):
    """Partner payout request model."""
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True)
    
    # Bank Details Snapshot (in case partner changes them later)
    bank_account_details = models.TextField(help_text="Snapshot of bank details at time of request")

    def __str__(self):
        return f"{self.shop.name} - {self.amount} ({self.status})"

    class Meta:
        ordering = ['-requested_at']
