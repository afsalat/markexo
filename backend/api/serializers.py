"""
Serializers for VorionMart API.
"""
import logging

from django.contrib.auth.models import User, Group, Permission
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Shop, Category, Product, ProductImage, Review, Customer,
    Order, OrderItem, OrderStatusHistory, Banner, SiteSetting, Enquiry,
    Cart, CartItem, Supplier, OrderForwardLog, PayoutRequest, Partner
)

logger = logging.getLogger(__name__)

def get_image_url(request, image_field):
    """Returns an absolute URL for an image file for production compatibility."""
    if image_field and hasattr(image_field, 'url'):
        if request:
            return request.build_absolute_uri(image_field.url)
        return image_field.url
    return None


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
        if 'is_staff' not in validated_data:
            validated_data['is_staff'] = True
        user = User.objects.create_user(**validated_data)
        if groups_data:
            user.groups.set(groups_data)
        return user

    def update(self, instance, validated_data):
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        
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

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description', 'address', 'city',
            'phone', 'email', 'image', 'is_active', 'approval_status',
            'product_count', 'created_at'
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


class ShopListSerializer(serializers.ModelSerializer):
    """Simplified shop serializer for listings."""
    image = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'image', 'city']

    def get_image(self, obj):
        request = self.context.get('request')
        return get_image_url(request, obj.image)


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


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'customer', 'customer_name', 'customer_email',
            'rating', 'comment', 'verified', 'created_at', 'created_at_formatted'
        ]
        read_only_fields = ['id', 'verified', 'created_at', 'customer']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%Y-%m-%d')

    def create(self, validated_data):
        # Set customer from request context
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                customer = Customer.objects.get(user=request.user)
                validated_data['customer'] = customer
                
                # Check for existing review
                if Review.objects.filter(customer=customer, product=validated_data['product']).exists():
                    raise serializers.ValidationError({"detail": "You have already reviewed this product."})
            except Customer.DoesNotExist:
                raise serializers.ValidationError("Customer profile not found.")
        return super().create(validated_data)


class PublicProductSerializer(serializers.ModelSerializer):
    """Product serializer for public view (Hides Vendor Info)."""
    category = CategoryListSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sale_price',
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
    shop_id = serializers.PrimaryKeyRelatedField(
        queryset=Shop.objects.all(), source='shop', write_only=True
    )
    shop_name = serializers.CharField(source='shop.name', read_only=True)
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
            'shop', 'shop_name', 'shop_id', 'category', 'category_name', 'category_id', 'image', 'images', 'uploaded_images',
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
    category = CategoryListSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = CategoryListSerializer(source='category', read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'sale_price', 'current_price',
            'discount_percent', 'image', 'shop', 'category', 'category_name', 'category_details',
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
            'id', 'product', 'shop', 'product_name', 'quantity',
            'price', 'total', 'product_image', 'shop_name', 'sku',
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


# Admin Dashboard Stats Serializer
class DashboardStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_products = serializers.IntegerField()
    total_shops = serializers.IntegerField()
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
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('No account found with this email.')
        
        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid password.')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
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
        
        # Try to get customer profile name if not staff
        if not user.is_staff:
            try:
                customer = Customer.objects.get(user=user)
                data['user']['name'] = customer.name
            except Customer.DoesNotExist:
                pass
                
        return data



class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'password_confirm')
        
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already registered.")
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
            name=f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
        )
        return user


class PartnerRegistrationSerializer(serializers.Serializer):
    """Serializer for partner/shop owner registration."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    shop_description = serializers.CharField(required=False, allow_blank=True)
    shop_address = serializers.CharField(required=False, allow_blank=True)
    shop_city = serializers.CharField(max_length=100)
    shop_phone = serializers.CharField(max_length=20)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        if Shop.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "A shop with this email already exists."})
        if Shop.objects.filter(phone=data['shop_phone']).exists():
            raise serializers.ValidationError({"shop_phone": "A shop with this phone number already exists."})
        return data

    def create(self, validated_data):
        from django.contrib.auth.models import Group
        
        # Create the user
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_staff=False  # Will be set to True when admin approves
        )
        
        # Assign Partner role if it exists
        try:
            partner_group = Group.objects.get(name='Partner')
            user.groups.add(partner_group)
        except Group.DoesNotExist:
            pass  # Role doesn't exist yet, user just won't have special permissions
        
        shop_name = validated_data.get('shop_name')
        if not shop_name:
            shop_name = f"{validated_data.get('first_name', '')}'s Shop".strip()
            if not shop_name or shop_name == "'s Shop":
                shop_name = f"Shop-{user.email}"

        # Create the shop
        shop = Shop.objects.create(
            name=shop_name,
            description=validated_data.get('shop_description', ''),
            owner=user,
            email=validated_data['email'],
            phone=validated_data['shop_phone'],
            address=validated_data.get('shop_address', ''),
            city=validated_data['shop_city'],
            commission_rate=50.00,
            is_active=True,
            approval_status='pending'
        )
        
        return {'user': user, 'shop': shop}


class AdminPartnerSerializer(serializers.Serializer):
    """Serializer for admin to manage partners (User + Shop)."""
    id = serializers.IntegerField(source='user.id', read_only=True)
    # User Fields
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    is_active = serializers.BooleanField(default=True)
    
    # Shop Fields (write_only=True ensures we don't try to read them from User instance automatically)
    shop_id = serializers.IntegerField(read_only=True)
    shop_name = serializers.CharField(max_length=200, write_only=True, required=False, allow_blank=True)
    shop_description = serializers.CharField(required=False, allow_blank=True, write_only=True)
    shop_address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    shop_city = serializers.CharField(max_length=100, write_only=True)
    shop_phone = serializers.CharField(max_length=20, write_only=True)
    commission_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=50.00, write_only=True)
    approval_status = serializers.ChoiceField(choices=Shop.APPROVAL_STATUS_CHOICES, default='approved', write_only=True)

    def to_representation(self, instance):
        """
        Custom representation to blend User and Shop data.
        """
        # Base User Data
        data = {
            'id': instance.id,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'is_active': instance.is_active,
        }

        # Find shop
        shop = Shop.objects.filter(owner=instance).first()
        if shop:
            data['shop_id'] = shop.id
            data['shop_name'] = shop.name
            data['shop_description'] = shop.description
            data['shop_address'] = shop.address
            data['shop_city'] = shop.city
            data['shop_phone'] = shop.phone
            data['commission_rate'] = str(shop.commission_rate)
            data['approval_status'] = shop.approval_status
        else:
             # If no shop
            data['shop_id'] = None
            data['shop_name'] = ""
            data['shop_description'] = ""
            data['shop_address'] = ""
            data['shop_city'] = ""
            data['shop_phone'] = ""
            data['commission_rate'] = "50.00"
            data['approval_status'] = 'pending'
            
        return data

    def create(self, validated_data):
        from django.contrib.auth.models import Group
        
        # Extract User Data
        email = validated_data.get('email')
        password = validated_data.get('password')
        first_name = validated_data.get('first_name')
        last_name = validated_data.get('last_name', '')
        is_active = validated_data.get('is_active', True)

        # Check existing
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already registered."})

        # Create User
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

        # Extract Shop Data
        shop_name = validated_data.get('shop_name')
        if not shop_name:
            shop_name = f"{first_name}'s Shop".strip()
            if not shop_name or shop_name == "'s Shop":
                shop_name = f"Shop-{email}"

        shop_desc = validated_data.get('shop_description', '')
        shop_addr = validated_data.get('shop_address', '')
        shop_city = validated_data.get('shop_city')
        shop_phone = validated_data.get('shop_phone')
        commission = validated_data.get('commission_rate', 50.00)
        status = validated_data.get('approval_status', 'approved')

        # Create Shop
        Shop.objects.create(
            owner=user,
            name=shop_name,
            description=shop_desc,
            address=shop_addr,
            city=shop_city,
            phone=shop_phone,
            email=email, # Shop email matches user email
            commission_rate=commission,
            approval_status=status,
            is_active=(status == 'approved')
        )
        
        return user

    def update(self, instance, validated_data):
        # Update User
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.username = instance.email # Keep sync
        
        if validated_data.get('password'):
            instance.set_password(validated_data['password'])
            
        instance.save()
        
        # Update Shop
        shop = Shop.objects.filter(owner=instance).first()
        if shop:
            shop.name = validated_data.get('shop_name', shop.name)
            shop.description = validated_data.get('shop_description', shop.description)
            shop.address = validated_data.get('shop_address', shop.address)
            shop.city = validated_data.get('shop_city', shop.city)
            shop.phone = validated_data.get('shop_phone', shop.phone)
            shop.email = instance.email
            shop.commission_rate = validated_data.get('commission_rate', shop.commission_rate)
            shop.approval_status = validated_data.get('approval_status', shop.approval_status)
            
            if shop.approval_status == 'approved':
                shop.is_active = True
            elif shop.approval_status == 'rejected':
                shop.is_active = False
                
            shop.save()
            
        return instance


# Supplier API Serializers
class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier configuration."""
    masked_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'api_endpoint', 'api_key', 'masked_api_key', 
            'api_secret', 'webhook_url', 'is_active', 'auto_send',
            'orders_sent', 'success_rate', 'last_sync', 
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }
    
    def get_masked_api_key(self, obj):
        if obj.api_key:
            return '••••••••••••'
        return ''


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
