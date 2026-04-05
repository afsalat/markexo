"""
Serializers for VorionMart API.
"""
import logging
from decimal import Decimal

from django.contrib.auth.models import User, Group, Permission
from django.db import IntegrityError, transaction
from django.db.models import DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Shop, Category, Product, ProductImage, Review, ReviewImage, Customer,
    Order, OrderItem, OrderStatusHistory, Banner, SiteSetting, Enquiry,
    Cart, CartItem, Supplier, OrderForwardLog, PayoutRequest, Partner,
    ChecklistSection, ChecklistItem
)

logger = logging.getLogger(__name__)

def get_image_url(request, image_field):
    """Returns an absolute URL for an image file for production compatibility."""
    if image_field and hasattr(image_field, 'url'):
        if request:
            return request.build_absolute_uri(image_field.url)
        return image_field.url
    return None


def normalize_email_value(email):
    return (email or '').strip().lower()


def users_for_email(email):
    normalized_email = normalize_email_value(email)
    if not normalized_email:
        return User.objects.none()
    return User.objects.filter(email__iexact=normalized_email).order_by(
        '-is_active', '-is_staff', '-date_joined', '-id'
    )


def email_exists(email, exclude_user=None):
    queryset = users_for_email(email)
    if exclude_user is not None:
        exclude_id = exclude_user.pk if hasattr(exclude_user, 'pk') else exclude_user
        queryset = queryset.exclude(pk=exclude_id)
    return queryset.exists()


def get_or_create_customer_for_user(user):
    """Resolve a storefront customer profile for an authenticated user."""
    customer = Customer.objects.filter(user=user).first()
    if customer:
        return customer

    normalized_email = normalize_email_value(getattr(user, 'email', ''))
    if normalized_email:
        customer = Customer.objects.filter(email__iexact=normalized_email).order_by('id').first()
        if customer:
            if customer.user_id is None:
                customer.user = user
            if not customer.name:
                customer.name = f"{user.first_name} {user.last_name}".strip() or user.username
            if not customer.email:
                customer.email = normalized_email
            customer.save(update_fields=['user', 'name', 'email'])
            return customer

    return Customer.objects.create(
        user=user,
        email=normalized_email,
        name=f"{user.first_name} {user.last_name}".strip() or user.username,
        phone='',
        city='',
        pincode='',
    )


def get_shop_order_items_queryset(shop):
    return OrderItem.objects.filter(
        Q(shop=shop) | Q(shop__isnull=True, product__shop=shop)
    ).distinct()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        source='permissions',
        many=True,
        write_only=True
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_ids']

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    roles = RoleSerializer(source='groups', many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source='groups',
        many=True,
        write_only=True,
        required=False
    )
    direct_permissions = PermissionSerializer(source='user_permissions', many=True, read_only=True)
    all_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined', 'roles', 'role_ids', 'direct_permissions', 'all_permissions']
        read_only_fields = ['id', 'date_joined']

    def get_all_permissions(self, obj):
        # Flatten all group and direct permissions into a simple list of codenames
        perms = set()
        for group in obj.groups.all():
            for perm in group.permissions.all():
                perms.add(perm.codename)
        for perm in obj.user_permissions.all():
            perms.add(perm.codename)
        return list(perms)

    def create(self, validated_data):
        groups_data = validated_data.pop('groups', [])
        email = normalize_email_value(validated_data.get('email'))
        if email and email_exists(email):
            raise serializers.ValidationError({'email': 'Email already registered.'})
        if email:
            validated_data['email'] = email
        if 'is_staff' not in validated_data:
            validated_data['is_staff'] = True
        user = User.objects.create_user(**validated_data)
        if groups_data:
            user.groups.set(groups_data)
        return user

    def update(self, instance, validated_data):
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        email = validated_data.get('email')

        if email is not None:
            email = normalize_email_value(email)
            if email_exists(email, exclude_user=instance):
                raise serializers.ValidationError({'email': 'Email already registered.'})
            validated_data['email'] = email
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if groups_data is not None:
            instance.groups.set(groups_data)
        
        return instance


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = '__all__'


class PartnerSerializer(serializers.ModelSerializer):
    """Serializer for Partner/Employee model."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    shop_name = serializers.CharField(source='assigned_shop.name', read_only=True)
    
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Partner
        fields = [
            'id', 'user', 'user_email', 'user_name', 'employee_id',
            'phone', 'alternate_phone', 'profile_image', 'address', 'city', 'pincode', 'date_of_birth',
            'date_of_joining', 'designation', 'assigned_shop', 'shop_name', 'commission_rate',
            'bank_name', 'account_number', 'ifsc_code', 'upi_id', 'pan_number',
            'is_active', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee_id', 'date_of_joining', 'created_at', 'updated_at']
    
    def get_profile_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.profile_image)
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()



class ShopSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    shop_type_display = serializers.CharField(source='get_shop_type_display', read_only=True)
    sourcing_partners = serializers.SerializerMethodField()
    sourcing_partner_name = serializers.SerializerMethodField()
    sourcing_partner_email = serializers.SerializerMethodField()
    sourcing_partner_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    sourcing_partner_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    pending_payment = serializers.SerializerMethodField()
    pending_order_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description', 'address', 'city',
            'phone', 'email', 'shop_type', 'shop_type_display', 'source_platform',
            'website_url', 'contact_person', 'whatsapp_number', 'notes',
            'image', 'is_active', 'approval_status',
            'product_count', 'sourcing_partner', 'sourcing_partner_id', 'sourcing_partners', 'sourcing_partner_ids',
            'sourcing_partner_name', 'sourcing_partner_email',
            'pending_payment', 'pending_order_count', 'created_at'
        ]
        read_only_fields = ['slug', 'image', 'product_count', 'pending_payment', 'pending_order_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)

    def _get_sourcing_partners(self, obj):
        partners = list(obj.sourcing_partners.select_related('user').all())
        if partners:
            return partners
        if obj.sourcing_partner_id:
            return [obj.sourcing_partner]
        return []

    def _resolve_partner_instances(self, partner_ids):
        resolved = []
        for raw_id in partner_ids:
            partner = Partner.objects.filter(pk=raw_id).select_related('user').first()
            if partner is None:
                partner = Partner.objects.filter(user_id=raw_id).select_related('user').first()
            if partner is None:
                raise serializers.ValidationError({
                    'sourcing_partner_ids': [f'Invalid partner id "{raw_id}".']
                })
            if partner.id not in [item.id for item in resolved]:
                resolved.append(partner)
        return resolved

    def _apply_partner_assignments(self, shop, validated_data):
        partner_ids = validated_data.get('sourcing_partner_ids')
        legacy_partner_id = validated_data.get('sourcing_partner_id')

        if partner_ids is None and legacy_partner_id is None:
            return

        effective_ids = partner_ids if partner_ids is not None else []
        if legacy_partner_id:
            effective_ids = [legacy_partner_id, *effective_ids]

        partners = self._resolve_partner_instances(effective_ids) if effective_ids else []
        shop.sourcing_partner = partners[0] if partners else None
        shop.save(update_fields=['sourcing_partner'])
        shop.sourcing_partners.set(partners)

    def create(self, validated_data):
        partner_payload = {
            'sourcing_partner_ids': validated_data.pop('sourcing_partner_ids', None),
            'sourcing_partner_id': validated_data.pop('sourcing_partner_id', None),
        }
        shop = super().create(validated_data)
        self._apply_partner_assignments(shop, partner_payload)
        return shop

    def update(self, instance, validated_data):
        partner_payload = {
            'sourcing_partner_ids': validated_data.pop('sourcing_partner_ids', None),
            'sourcing_partner_id': validated_data.pop('sourcing_partner_id', None),
        }
        instance = super().update(instance, validated_data)
        self._apply_partner_assignments(instance, partner_payload)
        return instance

    def get_sourcing_partners(self, obj):
        partners = self._get_sourcing_partners(obj)
        return [
            {
                'id': partner.id,
                'user_id': partner.user_id,
                'name': f"{partner.user.first_name} {partner.user.last_name}".strip() or partner.user.email,
                'email': partner.user.email,
            }
            for partner in partners
        ]

    def get_sourcing_partner_name(self, obj):
        partners = self._get_sourcing_partners(obj)
        return ', '.join(
            f"{partner.user.first_name} {partner.user.last_name}".strip() or partner.user.email
            for partner in partners
        )

    def get_sourcing_partner_email(self, obj):
        partners = self._get_sourcing_partners(obj)
        return ', '.join(partner.user.email for partner in partners)

    def get_pending_payment(self, obj):
        pending_statuses = ['pending', 'pending_cod']
        blocked_order_statuses = ['cancelled', 'rto', 'returned', 'refunded']
        aggregate = get_shop_order_items_queryset(obj).filter(
            order__payment_status__in=pending_statuses
        ).exclude(
            order__status__in=blocked_order_statuses
        ).aggregate(
            total=Coalesce(
                Sum(
                    Coalesce(F('product__supplier_price'), Value(Decimal('0.00'))) * F('quantity'),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
                Value(Decimal('0.00')),
            )
        )
        return aggregate['total']

    def get_pending_order_count(self, obj):
        pending_statuses = ['pending', 'pending_cod']
        blocked_order_statuses = ['cancelled', 'rto', 'returned', 'refunded']
        return get_shop_order_items_queryset(obj).filter(
            order__payment_status__in=pending_statuses
        ).exclude(
            order__status__in=blocked_order_statuses
        ).values('order_id').distinct().count()


class ShopListSerializer(serializers.ModelSerializer):
    """Simplified shop serializer for listings."""
    image = serializers.SerializerMethodField()
    shop_type_display = serializers.CharField(source='get_shop_type_display', read_only=True)
    sourcing_partner_name = serializers.SerializerMethodField()
    sourcing_partners = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'image', 'city', 'shop_type', 'shop_type_display', 'sourcing_partner_name', 'sourcing_partners']

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)

    def get_sourcing_partner_name(self, obj):
        partners = list(obj.sourcing_partners.select_related('user').all())
        if not partners and obj.sourcing_partner_id:
            partners = [obj.sourcing_partner]
        return ', '.join(
            f"{partner.user.first_name} {partner.user.last_name}".strip() or partner.user.email
            for partner in partners
        )

    def get_sourcing_partners(self, obj):
        partners = list(obj.sourcing_partners.select_related('user').all())
        if not partners and obj.sourcing_partner_id:
            partners = [obj.sourcing_partner]
        return [
            {
                'id': partner.id,
                'user_id': partner.user_id,
                'name': f"{partner.user.first_name} {partner.user.last_name}".strip() or partner.user.email,
                'email': partner.user.email,
            }
            for partner in partners
        ]


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    product_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'parent_name', 'children', 'is_active', 'product_count'
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified category serializer for listings."""
    product_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary']
        
    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class ReviewImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'customer', 'customer_name', 'customer_email',
            'rating', 'comment', 'verified', 'created_at', 'created_at_formatted', 'images', 'uploaded_images'
        ]
        read_only_fields = ['id', 'verified', 'created_at', 'customer']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')

    def create(self, validated_data):
        request = self.context.get('request')
        uploaded_images = list(validated_data.pop('uploaded_images', []))
        if not uploaded_images and request:
            uploaded_images = request.FILES.getlist('uploaded_images') or request.FILES.getlist('images')
        if len(uploaded_images) > 5:
            raise serializers.ValidationError({"images": "You can upload up to 5 review images."})

        if request and hasattr(request, 'user') and request.user.is_authenticated:
            customer = get_or_create_customer_for_user(request.user)
            validated_data['customer'] = customer

            existing_review = Review.objects.filter(customer=customer, product=validated_data['product']).first()
            if existing_review:
                existing_review.rating = validated_data['rating']
                existing_review.comment = validated_data['comment']
                existing_review.save(update_fields=['rating', 'comment', 'updated_at'])
                if uploaded_images:
                    existing_review.images.all().delete()
                    for image in uploaded_images:
                        ReviewImage.objects.create(review=existing_review, image=image)
                return existing_review

        review = super().create(validated_data)
        for image in uploaded_images:
            ReviewImage.objects.create(review=review, image=image)
        return review


class PublicProductSerializer(serializers.ModelSerializer):
    """Product serializer for public view (Hides Vendor Info)."""
    category = CategoryListSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    mrp = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    our_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'mrp', 'our_price', 'price', 'sale_price',
            'current_price', 'discount_percent', 'stock', 'sku',
            'category', 'category_name', 'image', 'images',
            'meesho_url', 'specifications',
            'is_featured', 'is_active', 'rating', 'review_count', 'created_at'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class ProductSerializer(serializers.ModelSerializer):
    shop = ShopListSerializer(read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_id = serializers.PrimaryKeyRelatedField(
        queryset=Shop.objects.all(), source='shop', write_only=True, allow_null=True, required=False
    )
    category = CategoryListSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, allow_null=True, required=False
    )
    images = ProductImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_percent = serializers.IntegerField(read_only=True)
    rating = serializers.DecimalField(max_digits=3, decimal_places=1, read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description',
            'mrp', 'supplier_price', 'our_price',
            'price', 'sale_price',  # Legacy fields
            'current_price', 'discount_percent', 'profit_margin', 'profit_percent',
            'stock', 'sku',
            'shop', 'shop_name', 'shop_id',
            'category', 'category_name', 'category_id', 'image', 'images', 'uploaded_images',
            'meesho_url', 'specifications', 'is_featured', 'is_active', 'approval_status', 'views', 'sold_count', 'rating', 'review_count', 
            'created_at', 'created_by_name', 'created_by_email'
        ]

    def to_internal_value(self, data):
        import json
        # When submitted as multipart/form-data, specifications arrives as a raw JSON string.
        # Parse it into a Python dict before DRF JSONField validation runs.
        if hasattr(data, 'get') and 'specifications' in data:
            specs_raw = data.get('specifications')
            if isinstance(specs_raw, str):
                try:
                    parsed = json.loads(specs_raw)
                except (ValueError, TypeError):
                    parsed = {}
                if hasattr(data, '_mutable'):
                    data = data.copy()
                    data._mutable = True
                    data['specifications'] = json.dumps(parsed)
                    data._mutable = False
                else:
                    data = dict(data)
                    data['specifications'] = parsed
        return super().to_internal_value(data)

    def validate_specifications(self, value):
        import json
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (ValueError, TypeError):
                return {}
        return value or {}

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        product = Product.objects.create(**validated_data)
        
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)
            
        return product

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Handle deleted images
        request = self.context.get('request')
        if request and 'deleted_images' in request.data:
            try:
                import json
                deleted_ids = json.loads(request.data['deleted_images'])
                if deleted_ids:
                    ProductImage.objects.filter(
                        product=instance,
                        id__in=deleted_ids
                    ).delete()
            except (ValueError, TypeError) as e:
                logger.warning("Error processing deleted_images for product %s: %s", instance.id, e)

        # Standard update for direct fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Add new images
        for image in uploaded_images:
            ProductImage.objects.create(product=instance, image=image)
            
        return instance


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified product serializer for listings."""
    shop = ShopListSerializer(read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category = CategoryListSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = CategoryListSerializer(source='category', read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'sale_price', 'current_price',
            'discount_percent', 'image', 'shop', 'shop_name', 'category', 'category_name', 'category_details',
            'is_featured', 'stock', 'approval_status', 'views', 'sold_count', 'rating', 'review_count'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'city', 'pincode', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    sku = serializers.CharField(source='product.sku', read_only=True)

    mrp = serializers.DecimalField(source='product.mrp', max_digits=10, decimal_places=2, read_only=True)
    original_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'shop', 'shop_name', 'product_name', 'quantity',
            'price', 'total', 'product_image', 'sku',
            'mrp', 'original_price'
        ]

    def get_product_image(self, obj):
        request = self.context.get('request')
        # product_image source is product.image
        if obj.product and obj.product.image:
            return get_image_url(request, obj.product.image)
        return None


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for order status history entries."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'changed_at', 'note']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    supplier_total_cost = serializers.SerializerMethodField()
    profit = serializers.SerializerMethodField()
    return_reason = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer', 'delivery_address', 'delivery_city', 'delivery_pincode', 'total_amount',
            'payment_status', 'payment_status_display', 'status', 'status_display',
            'is_cod', 'items', 'created_at', 'updated_at', 'status_history',
            'notes', 'cancellation_reason', 'refund_status', 'meesho_order_id',
            'supplier_total_cost', 'profit', 'return_reason'
        ]

    def get_supplier_total_cost(self, obj):
        total_cost = 0
        for item in obj.items.all():
            if item.product and item.product.supplier_price:
                 total_cost += item.product.supplier_price * item.quantity
        return total_cost

    def get_profit(self, obj):
        supplier_cost = self.get_supplier_total_cost(obj)
        if obj.total_amount:
            return float(obj.total_amount) - float(supplier_cost)
        return 0

    def get_return_reason(self, obj):
        """Extract return reason from notes field."""
        if obj.notes and '[Return Reason]:' in obj.notes:
            # Extract everything after [Return Reason]: marker
            reason = obj.notes.split('[Return Reason]:')[1].strip()
            # Remove any trailing markers or extra content
            if '\n[' in reason:
                reason = reason.split('\n[')[0].strip()
            return reason
        return None




class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders."""
    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20)
    delivery_address = serializers.CharField()
    delivery_city = serializers.CharField(max_length=100)
    delivery_pincode = serializers.CharField(max_length=10)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'is_active', 'order']

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = '__all__'


class ChecklistItemSerializer(serializers.ModelSerializer):
    section_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChecklistItem
        fields = [
            'id', 'section_id', 'title', 'description', 'priority', 'status',
            'owner', 'notes', 'is_completed', 'display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChecklistSectionSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = ChecklistSection
        fields = ['id', 'title', 'description', 'display_order', 'created_at', 'updated_at', 'items']


class ChecklistSectionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistSection
        fields = ['id', 'title', 'description', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_title(self, value):
        normalized = value.strip()
        queryset = ChecklistSection.objects.filter(title__iexact=normalized)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('A checklist section with this title already exists.')
        return normalized

    def create(self, validated_data):
        if validated_data.get('display_order') is None:
            last_order = ChecklistSection.objects.order_by('-display_order').values_list('display_order', flat=True).first()
            validated_data['display_order'] = (last_order or 0) + 1
        return super().create(validated_data)


class ChecklistItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = [
            'id', 'section', 'title', 'description', 'priority', 'status',
            'owner', 'notes', 'is_completed', 'display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        status_value = attrs.get('status')
        is_completed = attrs.get('is_completed')

        if status_value is not None:
            attrs['is_completed'] = status_value == ChecklistItem.STATUS_COMPLETED
        elif is_completed is not None:
            if is_completed:
                attrs['status'] = ChecklistItem.STATUS_COMPLETED
            else:
                current_status = instance.status if instance else ChecklistItem.STATUS_NOT_STARTED
                if current_status == ChecklistItem.STATUS_COMPLETED:
                    attrs['status'] = ChecklistItem.STATUS_NOT_STARTED
                attrs['is_completed'] = False
        elif instance is not None:
            attrs['is_completed'] = instance.is_completed

        return attrs

    def create(self, validated_data):
        if validated_data.get('display_order') is None:
            section = validated_data['section']
            last_order = section.items.order_by('-display_order').values_list('display_order', flat=True).first()
            validated_data['display_order'] = (last_order or 0) + 1
        return super().create(validated_data)


# Admin Dashboard Stats Serializer
class DashboardStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_products = serializers.IntegerField()
    total_customers = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    recent_orders = OrderSerializer(many=True)
    revenue_history = serializers.ListField(
        child=serializers.DictField()
    )
    order_status_distribution = serializers.ListField(
        child=serializers.DictField()
    )


# Cart Serializers
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_amount', 'created_at', 'updated_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the default username field
        if 'username' in self.fields:
            del self.fields['username']
    
    def validate(self, attrs):
        email = normalize_email_value(attrs.get('email'))
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        candidates = list(users_for_email(email))
        if not candidates:
            raise serializers.ValidationError('No account found with this email.')

        matching_users = [user for user in candidates if user.check_password(password)]
        if not matching_users:
            raise serializers.ValidationError('Invalid password.')

        active_users = [user for user in matching_users if user.is_active]
        if not active_users:
            raise serializers.ValidationError('User account is disabled.')

        user = active_users[0]
        if len(candidates) > 1:
            logger.warning(
                "Multiple users found for email %s; authenticated user id=%s",
                email,
                user.id,
            )
        
        # staff restriction removed intentionally to allow customer login
        
        # Generate tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        self.user = user
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'is_staff': user.is_staff
            }
        }
        
        customer = get_or_create_customer_for_user(user)
        if customer.name:
            data['user']['name'] = customer.name
        data['user']['phone'] = customer.phone or ''
                
        return data



class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=20)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm')
        
    def validate(self, data):
        data['email'] = normalize_email_value(data.get('email'))
        data['phone'] = (data.get('phone') or '').strip()
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        if email_exists(data['email']):
            raise serializers.ValidationError("Email already registered.")
        if not data['phone']:
            raise serializers.ValidationError({"phone": "Phone number is required."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_staff=False
        )
        # Create Customer profile
        Customer.objects.create(
            user=user,
            email=validated_data['email'],
            name=f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip(),
            phone=validated_data['phone'],
            city='',
            pincode='',
        )
        return user


class PartnerRegistrationSerializer(serializers.Serializer):
    """Serializer for partner registration."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        data['email'] = normalize_email_value(data.get('email'))
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if email_exists(data['email']):
            raise serializers.ValidationError({"email": "Email already registered."})
        if Partner.objects.filter(phone=data['phone']).exists():
            raise serializers.ValidationError({"phone": "A partner with this phone number already exists."})
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_staff=False
        )

        try:
            partner_group = Group.objects.get(name='Partner')
            user.groups.add(partner_group)
        except Group.DoesNotExist:
            pass

        try:
            Partner.objects.create(
                user=user,
                phone=validated_data['phone'],
                address=validated_data.get('address', ''),
                city=validated_data['city'],
                designation='Partner',
                is_active=True,
            )
        except IntegrityError:
            raise serializers.ValidationError({"detail": "Unable to create partner account right now. Please try again."})

        return {'user': user}


class AdminPartnerSerializer(serializers.Serializer):
    """Serializer for admin to manage partner users."""
    id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    is_active = serializers.BooleanField(default=True)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=50.00, write_only=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def to_representation(self, instance):
        partner_profile = getattr(instance, 'partner_profile', None)
        data = {
            'id': instance.id,
            'partner_profile_id': partner_profile.id if partner_profile else None,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'is_active': instance.is_active,
            'phone': partner_profile.phone if partner_profile else '',
            'address': partner_profile.address if partner_profile else '',
            'city': partner_profile.city if partner_profile else '',
            'commission_rate': str(partner_profile.commission_rate if partner_profile else '50.00'),
            'notes': partner_profile.notes if partner_profile else '',
        }
        return data

    def create(self, validated_data):
        from django.contrib.auth.models import Group

        email = normalize_email_value(validated_data.get('email'))
        password = validated_data.get('password')
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name', '')
        is_active = validated_data.get('is_active', True)

        if email_exists(email):
            raise serializers.ValidationError({"email": "Email already registered."})

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True, # Partners are staff
            is_active=is_active
        )

        # Assign Partner Role
        try:
            partner_group = Group.objects.get(name='Partner')
            user.groups.add(partner_group)
        except Group.DoesNotExist:
            pass

        Partner.objects.create(
            user=user,
            phone=validated_data.get('phone'),
            address=validated_data.get('address', ''),
            city=validated_data.get('city', ''),
            designation='Partner',
            commission_rate=validated_data.get('commission_rate', 50.00),
            notes=validated_data.get('notes', ''),
            is_active=is_active,
        )

        return user

    def update(self, instance, validated_data):
        email = normalize_email_value(validated_data.get('email', instance.email))
        if email_exists(email, exclude_user=instance):
            raise serializers.ValidationError({"email": "Email already registered."})

        # Update User
        instance.email = email
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.username = instance.email # Keep sync
        
        if validated_data.get('password'):
            instance.set_password(validated_data['password'])
            
        instance.save()

        partner_profile, _ = Partner.objects.get_or_create(
            user=instance,
            defaults={
                'phone': validated_data.get('phone', ''),
                'city': validated_data.get('city', ''),
                'address': validated_data.get('address', ''),
                'designation': 'Partner',
            },
        )
        partner_profile.phone = validated_data.get('phone', partner_profile.phone)
        partner_profile.address = validated_data.get('address', partner_profile.address)
        partner_profile.city = validated_data.get('city', partner_profile.city)
        partner_profile.commission_rate = validated_data.get('commission_rate', partner_profile.commission_rate)
        partner_profile.notes = validated_data.get('notes', partner_profile.notes)
        partner_profile.is_active = instance.is_active
        partner_profile.save()

        return instance


# Supplier API Serializers
class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier configuration."""
    masked_api_key = serializers.SerializerMethodField()
    supplier_type_display = serializers.CharField(source='get_supplier_type_display', read_only=True)
    has_api_access = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'supplier_type', 'supplier_type_display',
            'source_platform', 'website_url', 'store_url',
            'contact_person', 'contact_email', 'contact_phone', 'whatsapp_number',
            'instagram_handle', 'address', 'city', 'notes',
            'api_endpoint', 'api_key', 'masked_api_key', 'has_api_access',
            'api_secret', 'webhook_url', 'is_active', 'auto_send',
            'orders_sent', 'success_rate', 'last_sync', 
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'api_key': {'write_only': True, 'required': False, 'allow_blank': True},
            'api_secret': {'write_only': True, 'required': False, 'allow_blank': True},
        }
    
    def get_masked_api_key(self, obj):
        if obj.api_key:
            return '••••••••••••'
        return ''

    def get_has_api_access(self, obj):
        return bool(obj.api_endpoint and obj.api_key)


class OrderForwardLogSerializer(serializers.ModelSerializer):
    """Serializer for order forwarding logs."""
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OrderForwardLog
        fields = [
            'id', 'order', 'order_id', 'supplier', 'supplier_name',
            'status', 'status_display', 'request_data', 'response_data',
            'response_message', 'supplier_order_id', 'retry_count',
            'created_at', 'updated_at'
        ]


class OrderForwardSerializer(serializers.Serializer):
    """Serializer for manual order forwarding request."""
    order_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    supplier_id = serializers.IntegerField()

class PayoutRequestSerializer(serializers.ModelSerializer):
    """Serializer for Payout Requests."""
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    partner_name = serializers.SerializerMethodField()
    partner_email = serializers.SerializerMethodField()
    partner_phone = serializers.CharField(source='shop.phone', read_only=True)

    class Meta:
        model = PayoutRequest
        fields = ['id', 'shop', 'shop_name', 'partner_name', 'partner_email', 'partner_phone', 'amount', 'status', 'requested_at', 'processed_at', 'transaction_id', 'notes', 'bank_account_details']
        read_only_fields = ['id', 'requested_at', 'shop']

    def get_partner_name(self, obj):
        if obj.shop.owner:
            return f"{obj.shop.owner.first_name} {obj.shop.owner.last_name}"
        return "Unknown"

    def get_partner_email(self, obj):
        if obj.shop.owner:
            return obj.shop.owner.email
        return "Unknown"
