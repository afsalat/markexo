"""
API Views for Markexo marketplace.
"""
from rest_framework import viewsets, generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, action
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDay
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User, Group, Permission
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, DjangoModelPermissions

from django.core.mail import send_mail
from .models import (
    Shop, Category, Product, ProductImage, Customer,
    Order, OrderItem, Banner, SiteSetting, Subscription, Enquiry
)
from .serializers import (
    ShopSerializer, ShopListSerializer,
    CategorySerializer, CategoryListSerializer,
    ProductSerializer, ProductListSerializer,
    CustomerSerializer, OrderSerializer, OrderCreateSerializer,
    OrderItemSerializer, BannerSerializer, SiteSettingSerializer,
    DashboardStatsSerializer, SubscriptionSerializer, EnquirySerializer,
    UserSerializer, RoleSerializer, PermissionSerializer
)


# ============== Public API Views ==============

class ShopViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for shops."""
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return ShopListSerializer
        return ShopSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for categories."""
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for products."""
    queryset = Product.objects.filter(is_active=True, shop__is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

        # Filter by shop
        shop = self.request.query_params.get('shop')
        if shop:
            queryset = queryset.filter(shop__slug=shop)

        # Filter by featured
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        # Price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Sorting
        sort = self.request.query_params.get('sort')
        if sort == 'price_low':
            queryset = queryset.order_by('price')
        elif sort == 'price_high':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')

        return queryset


class BannerListView(generics.ListAPIView):
    """Public API for active banners."""
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]


class CreateEnquiryView(generics.CreateAPIView):
    """Public API to create an enquiry."""
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [AllowAny]


class SiteSettingView(APIView):
    """Get site settings."""
    permission_classes = [AllowAny]
    def get(self, request):
        setting = SiteSetting.objects.first()
        if setting:
            serializer = SiteSettingSerializer(setting)
            return Response(serializer.data)
        return Response({})


class CreateOrderView(APIView):
    """Create a new order."""
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data

            # Create or get customer
            customer, created = Customer.objects.get_or_create(
                email=data['customer_email'],
                defaults={
                    'name': data['customer_name'],
                    'phone': data['customer_phone'],
                    'address': data['delivery_address'],
                    'city': data['delivery_city'],
                    'pincode': data['delivery_pincode'],
                }
            )

            # Calculate totals
            total_amount = 0
            total_commission = 0
            order_items = []
            
            # Group items by shop for email notifications
            shop_items = {}

            for item in data['items']:
                product = get_object_or_404(Product, id=item['product_id'])
                quantity = item.get('quantity', 1)
                price = product.current_price
                item_total = price * quantity
                
                # Calculate commission based on product rate (mandatory)
                commission_rate = product.commission_rate
                commission = item_total * (commission_rate / 100)

                total_amount += item_total
                total_commission += commission

                order_item_data = {
                    'product': product,
                    'shop': product.shop,
                    'product_name': product.name,
                    'quantity': quantity,
                    'price': price,
                    'commission': commission,
                }
                order_items.append(order_item_data)
                
                # Add to shop items dict
                if product.shop.id not in shop_items:
                    shop_items[product.shop.id] = {
                        'shop': product.shop,
                        'items': []
                    }
                shop_items[product.shop.id]['items'].append(order_item_data)

            # Create order
            order = Order.objects.create(
                customer=customer,
                total_amount=total_amount,
                commission_amount=total_commission,
                delivery_address=data['delivery_address'],
                delivery_city=data['delivery_city'],
                delivery_pincode=data['delivery_pincode'],
                notes=data.get('notes', ''),
            )

            # Create order items
            for item in order_items:
                OrderItem.objects.create(order=order, **item)
                
            # Send emails to shops
            for shop_id, shop_data in shop_items.items():
                shop = shop_data['shop']
                if shop.email:
                    email_subject = f"New Order Received - #{order.order_id}"
                    email_body = f"Hello {shop.name},\n\nYou have received a new order!\n\nOrder ID: {order.order_id}\n\nItems:\n"
                    
                    for item in shop_data['items']:
                        email_body += f"- {item['product_name']} x {item['quantity']} (Total: {item['price'] * item['quantity']})\n"
                        
                    email_body += f"\nPlease login to your dashboard to process this order.\n\nRegards,\nMarkexo Team"
                    
                    try:
                        send_mail(
                            email_subject,
                            email_body,
                            'noreply@markexo.com',
                            [shop.email],
                            fail_silently=True,
                        )
                        print(f"Email sent to {shop.email}")
                    except Exception as e:
                        print(f"Failed to send email to {shop.email}: {e}")

            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    """Get order details by order ID."""
    permission_classes = [AllowAny]
    def get(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


# ============== Admin API Views ==============

class AdminModelPermissions(DjangoModelPermissions):
    """
    Custom permission to enforce model permissions for all methods including GET.
    """
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }

class AdminDashboardPermission(permissions.BasePermission):
    """
    Custom permission for dashboard stats.
    Requires view_shop or view_order as a proxy for dashboard access.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff and
            (
                request.user.has_perm('api.view_shop') or 
                request.user.has_perm('api.view_order') or
                request.user.has_perm('api.view_product') or
                request.user.has_perm('api.view_category') or
                request.user.has_perm('api.view_customer') or
                request.user.has_perm('api.view_enquiry')
            )
        )

class AdminUserViewSet(viewsets.ModelViewSet):
    """Management of admin users."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated(), IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=['GET'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return response.Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset


class AdminRoleViewSet(viewsets.ModelViewSet):
    """Management of roles (Groups)."""
    queryset = Group.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

class PermissionListView(generics.ListAPIView):
    """Read-only view for all permissions."""
    queryset = Permission.objects.all().order_by('content_type__app_label', 'codename')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None # Show all permissions for selection


class AdminDashboardStatsView(APIView):
    """Admin dashboard statistics."""
    permission_classes = [IsAuthenticated, AdminDashboardPermission]
    def get(self, request):
        orders = Order.objects.all()

        # Revenue History (Last 7 days)
        from django.utils import timezone
        from datetime import timedelta
        seven_days_ago = timezone.now().date() - timedelta(days=6)
        
        revenue_history_qs = orders.filter(created_at__date__gte=seven_days_ago) \
            .annotate(date=TruncDay('created_at')) \
            .values('date') \
            .annotate(revenue=Sum('total_amount')) \
            .order_by('date')

        # Fill in missing dates with zero revenue
        revenue_history = []
        date_map = {item['date'].date(): float(item['revenue']) for item in revenue_history_qs}
        
        for i in range(7):
            curr_date = seven_days_ago + timedelta(days=i)
            revenue_history.append({
                'date': curr_date.strftime('%Y-%m-%d'),
                'revenue': date_map.get(curr_date, 0.0)
            })

        # Order Status Distribution
        status_dist = orders.values('status') \
            .annotate(count=Count('id')) \
            .order_by('-count')

        stats = {
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            'total_commission': orders.aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0,
            'total_products': Product.objects.count(),
            'total_shops': Shop.objects.count(),
            'total_customers': Customer.objects.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'recent_orders': OrderSerializer(orders[:10], many=True).data,
            'revenue_history': revenue_history,
            'order_status_distribution': list(status_dist),
        }

        return Response(stats)


from rest_framework.decorators import action

class AdminSubscriptionViewSet(viewsets.ModelViewSet):
    """Admin CRUD for subscriptions."""
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        shop_filter = self.request.query_params.get('shop')
        if shop_filter:
            queryset = queryset.filter(shop_id=shop_filter)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(shop__name__icontains=search) |
                Q(plan_name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        subscription = self.get_object()
        subscription.is_paid = True
        subscription.status = 'active'
        subscription.save()
        return Response({'status': 'Payment marked as received'})


class AdminShopViewSet(viewsets.ModelViewSet):
    """Admin CRUD for shops."""
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin CRUD for categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]


class AdminProductViewSet(viewsets.ModelViewSet):
    """Admin CRUD for products."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by shop
        shop = self.request.query_params.get('shop')
        if shop:
            queryset = queryset.filter(shop_id=shop)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset


class AdminOrderViewSet(viewsets.ModelViewSet):
    """Admin CRUD for orders."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by shop
        shop = self.request.query_params.get('shop')
        if shop:
            queryset = queryset.filter(items__shop_id=shop).distinct()

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_id__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__email__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order.status = 'cancelled'
        order.cancellation_reason = reason
        # If it was a prepaid order, we might set refund as pending
        # For simplicity, we'll let the admin decide the refund status
        order.save()
        return Response({'status': 'Order cancelled', 'cancellation_reason': reason})

    @action(detail=True, methods=['post'])
    def mark_refunded(self, request, pk=None):
        order = self.get_object()
        refund_status = request.data.get('refund_status', 'refunded')
        if refund_status in dict(Order.REFUND_STATUS_CHOICES):
            order.refund_status = refund_status
            order.save()
            return Response({'status': f'Refund status updated to {refund_status}'})
        return Response({'error': 'Invalid refund status'}, status=status.HTTP_400_BAD_REQUEST)


class AdminCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin view for customers."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class AdminBannerViewSet(viewsets.ModelViewSet):
    """Admin CRUD for banners."""
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer


class AdminEnquiryViewSet(viewsets.ModelViewSet):
    """Admin CRUD for enquiries."""
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(subject__icontains=search)
            )

        return queryset


class AdminSiteSettingView(APIView):
    """Admin site settings."""
    def get(self, request):
        setting, created = SiteSetting.objects.get_or_create(pk=1)
        serializer = SiteSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request):
        setting, created = SiteSetting.objects.get_or_create(pk=1)
        serializer = SiteSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
