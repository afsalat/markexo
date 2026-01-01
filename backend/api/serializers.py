"""
Serializers for Markexo API.
"""
from django.contrib.auth.models import User, Group, Permission
from rest_framework import serializers
from .models import (
    Shop, Category, Product, ProductImage, Customer,
    Order, OrderItem, Banner, SiteSetting, Subscription, Enquiry
)


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


class SubscriptionSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'shop', 'shop_name', 'plan_name', 'amount',
            'start_date', 'end_date', 'status', 'is_paid',
            'created_at'
        ]


class ShopSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description', 'address', 'city',
            'phone', 'email', 'image', 'is_active',
            'product_count', 'created_at', 'current_cycle_start'
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ShopListSerializer(serializers.ModelSerializer):
    """Simplified shop serializer for listings."""
    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'image', 'city']


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'children', 'is_active', 'product_count'
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified category serializer for listings."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary']


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
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'sale_price',
            'commission_rate', 'current_price', 'discount_percent', 'stock', 'sku',
            'shop', 'shop_name', 'shop_id', 'category', 'category_name', 'category_id', 'image', 'images',
            'is_featured', 'is_active', 'created_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified product serializer for listings."""
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'sale_price', 'current_price',
            'discount_percent', 'image', 'shop_name', 'category_name',
            'is_featured', 'stock'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'city', 'pincode', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.ImageField(source='product.image', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'shop', 'product_name', 'quantity',
            'price', 'commission', 'total', 'product_image', 'shop_name', 'sku'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer', 'total_amount', 'commission_amount',
            'status', 'status_display', 'refund_status', 'cancellation_reason',
            'delivery_address', 'delivery_city', 'delivery_pincode', 'notes',
            'items', 'created_at', 'updated_at'
        ]


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
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'is_active', 'order']


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = '__all__'


# Admin Dashboard Stats Serializer
class DashboardStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_commission = serializers.DecimalField(max_digits=12, decimal_places=2)
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
