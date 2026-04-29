"""
API Views for VorionMart marketplace.
"""
import os
import logging
import firebase_admin
from firebase_admin import auth as firebase_auth
from rest_framework_simplejwt.tokens import RefreshToken
from collections import deque
from pathlib import Path

from rest_framework import viewsets, generics, status, permissions, serializers
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, action
from django.db.models import Sum, Count, Q, F, DecimalField, Value
from django.db.models.functions import Coalesce, TruncDay
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.template.loader import render_to_string
from django.contrib.auth.models import User, Group, Permission
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser, DjangoModelPermissions
from decimal import Decimal

from django.core.cache import cache
from .models import (
    Shop, Category, Product, ProductImage, Review, Customer,
    Order, OrderItem, Banner, SiteSetting, Enquiry,
    Cart, CartItem, Supplier, OrderForwardLog, PayoutRequest, Partner,
    ChecklistSection, ChecklistItem, BlogPost
)
from .launch_checklist import (
    LAUNCH_CHECKLIST_PROJECT_NAME,
    ensure_launch_checklist_seeded,
    normalize_section_display_order,
    sync_launch_checklist_from_seed,
)
from .serializers import (
    ShopSerializer, ShopListSerializer,
    CategorySerializer, CategoryListSerializer,
    ProductSerializer, ProductListSerializer, PublicProductSerializer,
    ReviewSerializer, CustomerSerializer, OrderSerializer, OrderCreateSerializer,
    OrderItemSerializer, BannerSerializer, SiteSettingSerializer,
    DashboardStatsSerializer, EnquirySerializer,
    UserSerializer, RoleSerializer, PermissionSerializer,
    CartSerializer, CartItemSerializer, RegistrationSerializer, PartnerRegistrationSerializer, CustomTokenObtainPairSerializer,
    BlogPostSerializer, SupplierSerializer, OrderForwardLogSerializer, OrderForwardSerializer, AdminPartnerSerializer, PayoutRequestSerializer,
    ChecklistSectionSerializer, ChecklistSectionWriteSerializer, ChecklistItemSerializer, ChecklistItemWriteSerializer,
    normalize_email_value, get_or_create_customer_for_user,
)
from .ai_service import GeminiBlogService

from .order_emails import (
    send_order_created_email,
    send_order_status_email,
    send_payment_status_email,
    send_refund_status_email,
    send_return_request_email,
)
from .whatsapp import (
    build_twiml_message,
    is_valid_twilio_signature,
    normalize_phone_digits,
    send_order_alert_whatsapp,
    send_order_confirmation_whatsapp,
)

logger = logging.getLogger(__name__)

# Initialize Firebase Admin if not already initialized
if not firebase_admin._apps:
    try:
        # 1. Try environment variables (best for production)
        project_id = os.environ.get('FIREBASE_PROJECT_ID')
        private_key = os.environ.get('FIREBASE_PRIVATE_KEY')
        client_email = os.environ.get('FIREBASE_CLIENT_EMAIL')

        if project_id and private_key and client_email:
            # Handle potential escaping of newlines in env vars
            if "\\n" in private_key:
                private_key = private_key.replace("\\n", "\n")
            
            cred = firebase_admin.credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized using environment variables.")
        else:
            # 2. Try the service account JSON file (local development)
            cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
            if os.path.exists(cred_path):
                cred = firebase_admin.credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized using service account JSON.")
            else:
                # 3. Fallback for environments with default credentials (e.g., GCP)
                firebase_admin.initialize_app()
                logger.info("Firebase initialized using default credentials.")
    except Exception as e:
        logger.error(f"Firebase initialization error: {e}")
        # Final fallback to prevent crash, though subsequent auth calls will fail
        try:
            firebase_admin.initialize_app()
        except Exception:
            pass


def get_sales_orders_queryset(queryset=None):
    base_queryset = queryset if queryset is not None else Order.objects.all()
    return base_queryset.exclude(status__in=Order.SALES_EXCLUDED_STATUSES)


def get_sales_order_items_queryset(queryset=None):
    base_queryset = queryset if queryset is not None else OrderItem.objects.all()
    return base_queryset.exclude(order__status__in=Order.SALES_EXCLUDED_STATUSES)


def is_partner_user(user):
    return bool(
        user and
        user.is_authenticated and
        user.groups.filter(name='Partner').exists()
    )


def get_partner_catalog_shops(user):
    if not user or not user.is_authenticated:
        return Shop.objects.none()

    assigned_shop = getattr(user, 'partner_profile', None)
    assigned_shop_id = getattr(assigned_shop, 'assigned_shop_id', None)
    product_shop_ids = get_partner_products(user).exclude(shop__isnull=True).values_list('shop_id', flat=True)

    queryset = Shop.objects.filter(
        Q(id__in=product_shop_ids) |
        Q(owner=user) |
        Q(email__iexact=user.email)
    )

    if assigned_shop_id:
        queryset = queryset | Shop.objects.filter(id=assigned_shop_id)

    return queryset.distinct()


def get_partner_products(user):
    if not user or not user.is_authenticated:
        return Product.objects.none()

    return Product.objects.filter(created_by=user).distinct()


def get_partner_payout_shops(user):
    if not user or not user.is_authenticated:
        return Shop.objects.none()

    return get_partner_catalog_shops(user)


def get_existing_customer_by_email(email):
    normalized_email = normalize_email_value(email)
    if not normalized_email:
        return None

    return Customer.objects.filter(email__iexact=normalized_email).order_by('-user_id', 'id').first()


# ============== Public API Views ==============

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterPartnerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PartnerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            user = result['user']
            return Response({
                "message": "Partner registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ShopViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for shops."""
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


# ============== Public API Views ==============

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for categories."""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # If 'flat' param is provided, don't filter by parent=None
        # Also, if searching, don't filter by parent=None to find subcategories
        flat = self.request.query_params.get('flat') == 'true'
        search = self.request.query_params.get('search')
        
        if not flat and not search:
            queryset = queryset.filter(parent=None)
            
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for products."""
    queryset = Product.objects.filter(is_active=True, approval_status='approved')
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return PublicProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

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

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Debounce view increment (per IP, 60 seconds)
        try:
            ip = request.META.get('REMOTE_ADDR')
            cache_key = f'product_view_{instance.id}_{ip}'
            if not cache.get(cache_key):
                instance.views += 1
                instance.save(update_fields=['views'])
                cache.set(cache_key, True, 60)
        except Exception as e:
            # Fallback if cache fails
            logger.warning("View increment error for product %s: %s", instance.id, e)
            instance.views += 1
            instance.save(update_fields=['views'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """Public API for product reviews."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Review.objects.all()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save()


class BannerListView(generics.ListAPIView):
    """Public API for active banners."""
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Banner.objects.filter(is_active=True)
        section = (self.request.query_params.get('section') or '').strip()
        if section:
            queryset = queryset.filter(section=section)
        return queryset


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
            serializer = SiteSettingSerializer(setting, context={'request': request})
            return Response(serializer.data)
        return Response({})


class CreateOrderView(APIView):
    """Create a new order."""
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.info("Order validation failed: %s", serializer.errors)
            return Response({
                'error': 'Invalid order data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        phone = data['customer_phone']

        # 1. Validate Phone (Basic Indian Format)
        if len(phone) < 10 or not phone.isdigit():
             return Response({'error': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

        # Reuse the oldest matching customer profile when duplicate emails exist.
        normalized_email = normalize_email_value(data['customer_email'])
        customer = get_existing_customer_by_email(normalized_email)
        if customer is None:
            customer = Customer.objects.create(
                email=normalized_email,
                name=data['customer_name'],
                phone=phone,
                address=data['delivery_address'],
                city=data['delivery_city'],
                pincode=data['delivery_pincode'],
            )
        else:
            customer.name = data['customer_name'] or customer.name
            customer.phone = phone or customer.phone
            customer.address = data['delivery_address'] or customer.address
            customer.city = data['delivery_city'] or customer.city
            customer.pincode = data['delivery_pincode'] or customer.pincode
            customer.save(update_fields=['name', 'phone', 'address', 'city', 'pincode'])

        # 2. Check RTO Risk
        if customer.rto_count >= 2:
            return Response(
                {'error': 'COD not available for this account due to high return rate. Please contact support.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_amount = 0
        order_items = []
        
        for item in data['items']:
            product = get_object_or_404(Product, id=item['product_id'])
            quantity = item.get('quantity', 1)
            price = product.current_price
            item_total = price * quantity

            total_amount += item_total

            # Update sold count
            product.sold_count += quantity
            product.save(update_fields=['sold_count'])

            order_item_data = {
                'product': product,
                'shop': product.shop,
                'product_name': product.name,
                'quantity': quantity,
                'price': price,
            }
            order_items.append(order_item_data)

        order = Order.objects.create(
            customer=customer,
            total_amount=total_amount,
            delivery_address=data['delivery_address'],
            delivery_city=data['delivery_city'],
            delivery_pincode=data['delivery_pincode'],
            notes=data.get('notes', ''),
            status='pending_verification',
            payment_status='pending_cod',
            is_cod=True 
        )

        # 5. Create order items
        for item in order_items:
            OrderItem.objects.create(order=order, **item)
        
        # 6. Update Customer Metrics
        customer.order_count += 1
        customer.save()

        send_order_created_email(order)
        site_setting = SiteSetting.objects.filter(pk=1).first() or SiteSetting.objects.first()
        try:
            send_order_confirmation_whatsapp(order)
            send_order_alert_whatsapp(order, getattr(site_setting, 'whatsapp_number', ''))
        except Exception:
            logger.exception("WhatsApp notification flow failed for order %s", order.order_id)

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class TwilioWhatsAppWebhookView(APIView):
    """Handle inbound WhatsApp replies from customers."""
    permission_classes = [AllowAny]
    parser_classes = [FormParser, MultiPartParser, JSONParser]

    def post(self, request):
        if not is_valid_twilio_signature(request):
            logger.warning('Rejected Twilio WhatsApp webhook due to invalid signature.')
            return HttpResponse('Invalid signature', status=403, content_type='text/plain')

        from_number = request.data.get('From', '')
        body = (request.data.get('Body') or '').strip()
        profile_name = (request.data.get('ProfileName') or '').strip()
        to_number = request.data.get('To', '')
        message_sid = request.data.get('MessageSid', '')

        customer = self._find_customer_by_phone(from_number)
        latest_order = customer.orders.order_by('-created_at').first() if customer else None
        fallback_email = f"whatsapp-{normalize_phone_digits(from_number) or 'unknown'}@local.vorionmart"
        subject = (
            f"WhatsApp reply for order {latest_order.order_id}"
            if latest_order else
            f"WhatsApp reply from {from_number}"
        )
        message_body = body or '(empty WhatsApp message)'
        if latest_order:
            message_body = (
                f"{message_body}\n\n"
                f"[WhatsApp Meta]\n"
                f"Order ID: {latest_order.order_id}\n"
                f"Customer Phone: {from_number}\n"
                f"Twilio Message SID: {message_sid}\n"
                f"To: {to_number}"
            )

        Enquiry.objects.create(
            name=profile_name or getattr(customer, 'name', '') or from_number or 'WhatsApp Customer',
            email=getattr(customer, 'email', '') or fallback_email,
            subject=subject,
            message=message_body,
            status='pending',
            is_read=False,
        )

        reply_text = (
            f"Thanks {customer.name}, we received your message for order {latest_order.order_id}. "
            "Our team will reply shortly."
            if customer and latest_order else
            "Thanks, we received your message. Our team will reply shortly."
        )
        return HttpResponse(build_twiml_message(reply_text), content_type='application/xml')

    def _find_customer_by_phone(self, from_number):
        incoming_digits = normalize_phone_digits(from_number)
        if not incoming_digits:
            return None

        candidate_numbers = {incoming_digits}
        if len(incoming_digits) > 10:
            candidate_numbers.add(incoming_digits[-10:])

        queryset = Customer.objects.all().order_by('-created_at')
        for customer in queryset:
            stored_digits = normalize_phone_digits(customer.phone)
            if not stored_digits:
                continue
            if stored_digits in candidate_numbers or stored_digits[-10:] in candidate_numbers:
                return customer
        return None



class OrderDetailView(APIView):
    """Get order details by order ID."""
    permission_classes = [AllowAny]
    def get(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id)
        serializer = OrderSerializer(order, context={'request': request})
        return Response(serializer.data)


class CancelOrderView(APIView):
    """Allow customers to cancel their own orders."""
    permission_classes = [AllowAny]
    
    def post(self, request, order_id):
        # Get the order
        order = get_object_or_404(Order, order_id=order_id)
        
        # Verify customer email matches
        customer_email = request.data.get('customer_email')
        if not customer_email or customer_email != order.customer.email:
            return Response(
                {'error': 'Invalid customer email'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow cancellation for pending orders
        if order.status.lower() != 'pending_verification':
            return Response(
                {'error': 'This order cannot be cancelled. It has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel the order
        order.status = 'cancelled'
        order.cancellation_reason = request.data.get('reason', 'Cancelled by customer')
        order.save()
        send_order_status_email(order)
        
        return Response(
            {
                'status': 'success',
                'message': 'Order cancelled successfully',
                'order_id': order.order_id
            },
            status=status.HTTP_200_OK
        )



class ReturnOrderView(APIView):
    """Allow customers to return their delivered orders."""
    permission_classes = [AllowAny]
    
    def post(self, request, order_id):
        # Get the order
        order = get_object_or_404(Order, order_id=order_id)
        
        # Verify customer email matches
        customer_email = request.data.get('customer_email')
        if not customer_email or customer_email != order.customer.email:
            return Response(
                {'error': 'Invalid customer email'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow return for delivered orders
        if order.status.lower() != 'delivered':
            return Response(
                {'error': 'This order cannot be returned. Only delivered orders can be returned.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return the order
        order.status = 'returned'
        # Append return reason to notes as we did in admin
        return_reason = request.data.get('reason', 'Returned by customer')
        order.notes = f"[Return Reason]: {return_reason}\n{order.notes or ''}"
        order.refund_status = 'pending'
        order.save()
        send_return_request_email(order)
        send_refund_status_email(order)
        
        return Response(
            {
                'status': 'success',
                'message': 'Order returned successfully',
                'order_id': order.order_id
            },
            status=status.HTTP_200_OK
        )


class CustomerOrdersView(APIView):
    """Get orders for a customer by email."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            customer = get_existing_customer_by_email(email)
            if customer is None:
                return Response([])
            orders = Order.objects.filter(customer=customer).order_by('-created_at')
            serializer = OrderSerializer(orders, many=True, context={'request': request})
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response([])


# ============== Cart API Views ==============

class CartAPIView(APIView):
    """
    Cart API for managing shopping cart.
    Uses customer_id header for identification (can be enhanced with proper auth).
    """
    permission_classes = [AllowAny]

    def get_customer(self, request):
        """Get or create customer from request header."""
        customer_id = request.headers.get('X-Customer-Id')
        if customer_id:
            try:
                return Customer.objects.get(id=customer_id)
            except Customer.DoesNotExist:
                return None
        return None

    def get_cart(self, customer):
        """Get or create cart for customer."""
        if not customer:
            return None
        cart, created = Cart.objects.get_or_create(customer=customer)
        return cart

    def get(self, request):
        """Get cart contents."""
        customer = self.get_customer(request)
        if not customer:
            return Response({'items': [], 'total_items': 0, 'total_amount': 0})
        
        cart = self.get_cart(customer)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Add item to cart."""
        customer = self.get_customer(request)
        if not customer:
            return Response({'error': 'Customer not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        cart = self.get_cart(customer)
        
        # Check if item already exists in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request):
        """Update cart item quantity."""
        customer = self.get_customer(request)
        if not customer:
            return Response({'error': 'Customer not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        cart = self.get_cart(customer)
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not in cart'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        """Remove item from cart or clear cart."""
        customer = self.get_customer(request)
        if not customer:
            return Response({'error': 'Customer not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = request.data.get('product_id')
        clear_all = request.data.get('clear_all', False)
        
        cart = self.get_cart(customer)
        
        if clear_all:
            cart.items.all().delete()
        elif product_id:
            try:
                cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                cart_item.delete()
            except CartItem.DoesNotExist:
                return Response({'error': 'Item not in cart'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CartSerializer(cart, context={'request': request})
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
    Requires at least one admin-facing read permission.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff and
            (
                request.user.has_perm('api.view_order') or
                request.user.has_perm('api.view_product') or
                request.user.has_perm('api.view_category') or
                request.user.has_perm('api.view_customer') or
                request.user.has_perm('api.view_enquiry')
            )
        )


class AdminSystemLogsPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_staff and
            (
                request.user.is_superuser or
                request.user.has_perm('api.view_sitesetting')
            )
        )


class AdminLaunchChecklistView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        sections = ensure_launch_checklist_seeded()
        serializer = ChecklistSectionSerializer(sections, many=True)
        return Response({
            'project_name': LAUNCH_CHECKLIST_PROJECT_NAME,
            'sections': serializer.data,
        })


class AdminLaunchChecklistSeedView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        replace_existing = bool(request.data.get('replace_existing', False))
        sections = sync_launch_checklist_from_seed(replace_existing=replace_existing)
        serializer = ChecklistSectionSerializer(sections, many=True)
        return Response({
            'project_name': LAUNCH_CHECKLIST_PROJECT_NAME,
            'sections': serializer.data,
        }, status=status.HTTP_200_OK)


class AdminLaunchChecklistSectionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = ChecklistSectionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        section = serializer.save()
        normalize_section_display_order()
        section.refresh_from_db()
        return Response(
            ChecklistSectionSerializer(section).data,
            status=status.HTTP_201_CREATED,
        )


class AdminLaunchChecklistSectionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self, pk):
        return get_object_or_404(ChecklistSection, pk=pk)

    def patch(self, request, pk):
        section = self.get_object(pk)
        serializer = ChecklistSectionWriteSerializer(section, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        section = serializer.save()
        normalize_section_display_order()
        section.refresh_from_db()
        return Response(ChecklistSectionSerializer(section).data)

    def delete(self, request, pk):
        section = self.get_object(pk)
        section.delete()
        normalize_section_display_order()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminLaunchChecklistItemCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = ChecklistItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return Response(
            ChecklistItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class AdminLaunchChecklistItemDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self, pk):
        return get_object_or_404(ChecklistItem.objects.select_related('section'), pk=pk)

    def patch(self, request, pk):
        item = self.get_object(pk)
        serializer = ChecklistItemWriteSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return Response(ChecklistItemSerializer(item).data)

    def delete(self, request, pk):
        item = self.get_object(pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Management of admin users."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['GET'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

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
        sales_orders = get_sales_orders_queryset(orders)

        # Revenue History (Last 7 days)
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import F, Sum, Count, DecimalField
        from django.db.models.functions import TruncDay
        seven_days_ago = timezone.now().date() - timedelta(days=6)
        
        revenue_history_qs = sales_orders.filter(created_at__gte=seven_days_ago) \
            .annotate(date=TruncDay('created_at')) \
            .values('date') \
            .annotate(
                revenue=Sum('total_amount'),
                cost=Sum(F('items__product__supplier_price') * F('items__quantity'), output_field=DecimalField())
            ) \
            .order_by('date')

        # Fill in missing dates with zero revenue/profit
        revenue_history = []
        data_map = {item['date'].date(): {'revenue': float(item['revenue'] or 0), 'cost': float(item['cost'] or 0)} for item in revenue_history_qs}
        
        for i in range(7):
            curr_date = seven_days_ago + timedelta(days=i)
            day_data = data_map.get(curr_date, {'revenue': 0.0, 'cost': 0.0})
            revenue_history.append({
                'date': curr_date.strftime('%Y-%m-%d'),
                'revenue': day_data['revenue'],
                'profit': day_data['revenue'] - day_data['cost']
            })

        # Order Status Distribution
        status_dist = orders.values('status') \
            .annotate(count=Count('id')) \
            .order_by('-count')

        # Calculate Total Profit
        total_revenue = sales_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_cost = get_sales_order_items_queryset(OrderItem.objects.filter(order__in=orders)).aggregate(
            cost=Sum(F('product__supplier_price') * F('quantity'), output_field=DecimalField())
        )['cost'] or 0
        total_profit = total_revenue - total_cost

        stats = {
            'total_orders': orders.count(),
            'total_revenue': total_revenue,
            'total_profit': total_profit,
            'total_products': Product.objects.count(),
            'total_customers': Customer.objects.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'recent_orders': OrderSerializer(orders[:10], many=True, context={'request': request}).data,
            'revenue_history': revenue_history,
            'order_status_distribution': list(status_dist),
        }

        return Response(stats)


class AdminPartnerViewSet(viewsets.ModelViewSet):
    """Admin CRUD for partner users."""
    queryset = User.objects.filter(groups__name='Partner').distinct()
    serializer_class = AdminPartnerSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]
    
    def get_queryset(self):
        qs = User.objects.filter(groups__name='Partner').exclude(is_superuser=True).distinct().order_by('-date_joined')
        
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(email__icontains=search) | 
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(partner_profile__city__icontains=search)
            )
        return qs





class AdminShopViewSet(viewsets.ModelViewSet):
    """Admin CRUD for shops."""
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset().select_related('sourcing_partner__user', 'owner').prefetch_related('sourcing_partners__user')
        
        # RLS removed: User requests to see all shops
        # if not self.request.user.is_superuser:
        #     queryset = queryset.filter(owner=self.request.user)
        
        status = self.request.query_params.get('approval_status')
        if status:
            queryset = queryset.filter(approval_status=status)

        shop_type = self.request.query_params.get('shop_type')
        if shop_type:
            queryset = queryset.filter(shop_type=shop_type)

        sourcing_partner = self.request.query_params.get('sourcing_partner')
        if sourcing_partner:
            queryset = queryset.filter(sourcing_partner_id=sourcing_partner)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(contact_person__icontains=search) |
                Q(source_platform__icontains=search)
            )
            
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        shop = self.get_object()
        shop.approval_status = 'approved'
        shop.is_active = True
        shop.save()
        
        # Grant staff access to the shop owner so they can login
        if shop.owner:
            shop.owner.is_staff = True
            shop.owner.save(update_fields=['is_staff'])
        
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        shop = self.get_object()
        shop.approval_status = 'rejected'
        shop.is_active = False
        shop.save()
        
        # Revoke staff access from the shop owner
        if shop.owner:
            shop.owner.is_staff = False
            shop.owner.save(update_fields=['is_staff'])
        
        return Response({'status': 'rejected'})


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin CRUD for categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminProductViewSet(viewsets.ModelViewSet):
    """Admin CRUD for products."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()

        # RLS: Non-superusers can ONLY see products they created
        if not self.request.user.is_superuser:
            queryset = queryset.filter(created_by=self.request.user)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        # Filter by created_by (User ID) - mainly for superusers or specific filtering
        created_by = self.request.query_params.get('created_by')
        if created_by:
            queryset = queryset.filter(created_by_id=created_by)

        # Filter by approval_status
        status = self.request.query_params.get('approval_status')
        if status:
            queryset = queryset.filter(approval_status=status)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    def perform_create(self, serializer):
        # Auto-approve for admins, Pending for partners
        status = 'approved' if self.request.user.is_superuser else 'pending'
        serializer.save(created_by=self.request.user, approval_status=status)


class AdminOrderViewSet(viewsets.ModelViewSet):
    """Admin CRUD for orders."""
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser, AdminModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()

        # RLS: Limit to orders containing products the user created
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                items__product__created_by=self.request.user
            ).distinct()


        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by payment status
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            if ',' in payment_status:
                queryset = queryset.filter(payment_status__in=payment_status.split(','))
            else:
                queryset = queryset.filter(payment_status=payment_status)

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
    def update_status(self, request, pk=None):
        """Update order status manually."""
        order = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = dict(Order.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {list(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        
        # Update payment status based on order status
        if new_status == 'delivered':
            order.payment_status = 'received'
        elif new_status == 'rto':
            order.payment_status = 'failed_rto'
        elif new_status == 'returned':
            order.refund_status = 'pending'
        
        order.save()
        send_order_status_email(order)

        return Response({
            'status': 'success',
            'message': f'Order status updated to {new_status}',
            'order_status': new_status
        })

    @action(detail=True, methods=['post'])
    def update_payment_status(self, request, pk=None):
        """Update payment status manually."""
        order = self.get_object()
        new_status = request.data.get('payment_status')
        
        valid_statuses = dict(Order.PAYMENT_STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {list(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.payment_status = new_status
        order.save()
        send_payment_status_email(order)
        
        return Response({
            'status': 'success',
            'message': f'Payment status updated to {new_status}',
            'payment_status': new_status
        })

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order.status = 'cancelled'
        order.cancellation_reason = reason
        # If it was a prepaid order, we might set refund as pending
        # For simplicity, we'll let the admin decide the refund status
        order.save()
        send_order_status_email(order)
        return Response({'status': 'Order cancelled', 'cancellation_reason': reason})

    @action(detail=True, methods=['post'])
    def mark_refunded(self, request, pk=None):
        order = self.get_object()
        refund_status = request.data.get('refund_status', 'refunded')
        if refund_status in dict(Order.REFUND_STATUS_CHOICES):
            order.refund_status = refund_status
            order.save()
            send_refund_status_email(order)
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
    permission_classes = [IsAuthenticated, AdminSystemLogsPermission]

    def get(self, request):
        setting, created = SiteSetting.objects.get_or_create(pk=1)
        serializer = SiteSettingSerializer(setting, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        setting, created = SiteSetting.objects.get_or_create(pk=1)
        serializer = SiteSettingSerializer(setting, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SocialLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        provider = request.data.get('provider')
        token = request.data.get('token')

        if provider != 'google':
            return Response({'error': 'Unsupported provider'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify Firebase ID token
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email')
            name = decoded_token.get('name', '')
            
            if not email:
                return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or create user
            normalized_email = normalize_email_value(email)
            user = User.objects.filter(email__iexact=normalized_email).first()
            if not user:
                username = normalized_email.split('@')[0]
                # Ensure unique username
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=name.split(' ')[0] if name else '',
                    last_name=' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
                )
                user.set_unusable_password()
                user.save()

            # Ensure customer profile exists
            get_or_create_customer_for_user(user)

            # Generate JWT
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                }
            })

        except Exception as e:
            logger.error("Social login error: %s", str(e))
            return Response({'error': 'Social login failed'}, status=status.HTTP_400_BAD_REQUEST)


class AdminSystemLogsView(APIView):
    permission_classes = [IsAuthenticated, AdminSystemLogsPermission]

    def get(self, request):
        limit = request.query_params.get('limit', '250')
        level = request.query_params.get('level', 'ALL').upper()
        search = request.query_params.get('search', '').strip().lower()

        try:
            limit = max(50, min(int(limit), 1000))
        except (TypeError, ValueError):
            limit = 250

        log_path = Path(getattr(settings, 'SYSTEM_LOG_FILE', settings.BASE_DIR / 'logs' / 'system.log'))
        if not log_path.exists():
            return Response({
                'path': str(log_path),
                'exists': False,
                'updated_at': None,
                'lines': [],
            })

        with log_path.open('r', encoding='utf-8', errors='replace') as handle:
            recent_lines = list(deque(handle, maxlen=4000))

        if level != 'ALL':
            recent_lines = [line for line in recent_lines if f' {level} ' in line]

        if search:
            recent_lines = [line for line in recent_lines if search in line.lower()]

        lines = [line.rstrip('\n') for line in recent_lines[-limit:]]
        updated_at = timezone.datetime.fromtimestamp(
            log_path.stat().st_mtime,
            tz=timezone.get_current_timezone()
        )

        return Response({
            'path': str(log_path),
            'exists': True,
            'updated_at': updated_at.isoformat(),
            'lines': lines,
        })


# ============== Supplier API Views ==============

class AdminSupplierViewSet(viewsets.ModelViewSet):
    """Admin CRUD for suppliers."""
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test API connection to supplier."""
        supplier = self.get_object()
        # In production, this would make an actual API call to the supplier
        # For now, return success
        return Response({
            'status': 'success',
            'message': f'Connection to {supplier.name} successful',
            'supplier_id': supplier.id
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle supplier active status."""
        supplier = self.get_object()
        supplier.is_active = not supplier.is_active
        supplier.save()
        return Response({
            'status': 'success',
            'is_active': supplier.is_active
        })

    @action(detail=True, methods=['post'])
    def toggle_auto_send(self, request, pk=None):
        """Toggle auto-send setting."""
        supplier = self.get_object()
        supplier.auto_send = not supplier.auto_send
        supplier.save()
        return Response({
            'status': 'success',
            'auto_send': supplier.auto_send
        })


class OrderForwardLogViewSet(viewsets.ReadOnlyModelViewSet):
    """View forwarding logs."""
    queryset = OrderForwardLog.objects.all()
    serializer_class = OrderForwardLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        supplier = self.request.query_params.get('supplier')
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class ForwardOrdersView(APIView):
    """Manually forward orders to a supplier."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = OrderForwardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_ids = serializer.validated_data['order_ids']
        supplier_id = serializer.validated_data['supplier_id']

        try:
            supplier = Supplier.objects.get(id=supplier_id, is_active=True)
        except Supplier.DoesNotExist:
            return Response(
                {'error': 'Supplier not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )

        orders = Order.objects.filter(id__in=order_ids)
        if not orders.exists():
            return Response(
                {'error': 'No orders found with given IDs'},
                status=status.HTTP_404_NOT_FOUND
            )

        results = []
        from django.utils import timezone

        for order in orders:
            # Create forward log
            log = OrderForwardLog.objects.create(
                order=order,
                supplier=supplier,
                status='sent',
                response_message='Order forwarded successfully',
                request_data={
                    'order_id': order.order_id,
                    'customer': order.customer.name,
                    'total': str(order.total_amount),
                    'items': [{
                        'product': item.product_name,
                        'quantity': item.quantity,
                        'price': str(item.price)
                    } for item in order.items.all()]
                }
            )
            results.append({
                'order_id': order.order_id,
                'status': 'sent',
                'log_id': log.id
            })

        # Update supplier stats
        supplier.orders_sent += len(results)
        supplier.last_sync = timezone.now()
        supplier.save()

        return Response({
            'status': 'success',
            'message': f'{len(results)} orders forwarded to {supplier.name}',
            'results': results
        })


class PendingOrdersForForwardingView(APIView):
    """Get orders that can be forwarded to suppliers."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get confirmed orders that haven't been forwarded yet
        orders = Order.objects.filter(
            status__in=['confirmed', 'pending_verification']
        ).exclude(
            forward_logs__status='sent'
        ).order_by('-created_at')[:50]

        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)


class AdminAnalyticsView(APIView):
    """Admin product analytics."""
    permission_classes = [IsAuthenticated, AdminDashboardPermission]

    def get(self, request):
        # Most Clicked (Views)
        most_clicked = Product.objects.filter(is_active=True).order_by('-views')[:10]

        sales_ranked_products = Product.objects.filter(is_active=True).annotate(
            effective_sold_count=Coalesce(
                Sum(
                    'orderitem__quantity',
                    filter=~Q(orderitem__order__status__in=Order.SALES_EXCLUDED_STATUSES),
                ),
                Value(0),
            )
        )

        # Most Ordered (excluding cancelled/returned sales)
        most_ordered = sales_ranked_products.order_by('-effective_sold_count', '-views')[:10]

        # Less Performed (Bottom 10 by effective sold count then views)
        less_performed = sales_ranked_products.order_by('effective_sold_count', 'views')[:10]

        return Response({
            'most_clicked': self.serialize_products(most_clicked, request),
            'most_ordered': self.serialize_products(most_ordered, request),
            'less_performed': self.serialize_products(less_performed, request),
            'partner_payouts': self.get_partner_payouts(),
            'partner_revenue': self.get_partner_revenue(),
            'top_partners': self.get_top_partners(),
        })

    def serialize_products(self, queryset, request):
        products = list(queryset)
        data = ProductListSerializer(products, many=True, context={'request': request}).data
        effective_sold_counts = {
            product.id: int(getattr(product, 'effective_sold_count', product.sold_count or 0) or 0)
            for product in products
        }
        for item in data:
            item['sold_count'] = effective_sold_counts.get(item['id'], item.get('sold_count', 0))
        return data

    def get_top_partners(self):
        from django.db.models import Sum
        
        top_partners_qs = PayoutRequest.objects.filter(
            status='paid'
        ).values(
            'shop__owner__first_name',
            'shop__owner__last_name',
            'shop__owner__email',
            'shop__owner__username',
        ).annotate(
            total_payout=Sum('amount')
        ).order_by('-total_payout')[:10]
        
        return [
            {
                'name': (
                    f"{item['shop__owner__first_name']} {item['shop__owner__last_name']}".strip()
                    or item['shop__owner__username']
                    or 'Unknown'
                ),
                'email': item['shop__owner__email'],
                'total_payout': float(item['total_payout'] or 0)
            }
            for item in top_partners_qs
        ]

    def get_partner_payouts(self):
        from django.db.models import Sum
        
        payouts_qs = PayoutRequest.objects.filter(
            status='paid'
        ).values(
            'shop__owner__first_name', 
            'shop__owner__last_name', 
            'shop__owner__username'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')[:10]
        
        data = []
        for item in payouts_qs:
            name = f"{item['shop__owner__first_name']} {item['shop__owner__last_name']}".strip()
            if not name:
                name = item['shop__owner__username'] or 'Unknown'
            data.append({'name': name, 'amount': float(item['total'] or 0)})
            
        return data

    def get_partner_revenue(self):
        from django.db.models.functions import TruncMonth
        from django.db.models import Sum, F, DecimalField
        from django.utils import timezone
        from datetime import timedelta
        
        six_months_ago = timezone.now().date() - timedelta(days=180)
        
        revenue_qs = get_sales_order_items_queryset(OrderItem.objects.filter(
            order__created_at__gte=six_months_ago
        )).annotate(
            month=TruncMonth('order__created_at')
        ).values('month').annotate(
            total=Sum(F('price') * F('quantity'), output_field=DecimalField())
        ).order_by('month')
        
        return [
            {'month': item['month'].strftime('%b %Y') if item['month'] else 'Unknown', 'revenue': float(item['total'] or 0)}
            for item in revenue_qs
        ]


class PartnerDashboardStatsView(APIView):
    """Stats for Partner/Shop Owner Dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = get_partner_products(request.user)

        items = OrderItem.objects.filter(
            product__created_by=request.user
        ).distinct()
        sales_items = get_sales_order_items_queryset(items)

        total_sales = sales_items.aggregate(
            sales=Sum(F('price') * F('quantity'), output_field=DecimalField())
        )['sales'] or 0

        # Calculate Earnings (Profit Share)
        # Formula: Sum((Price - SupplierPrice) * Qty * CommissionRate) / 100
        from django.db.models.functions import Coalesce
        
        earnings_agg = sales_items.aggregate(
            earnings=Sum(
                (F('price') - Coalesce(F('product__supplier_price'), Value(Decimal('0.00')), output_field=DecimalField())) * 
                F('quantity') * 
                Value(Decimal('30.00'), output_field=DecimalField()),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        # Divide by 100 after summation (or handle safely)
        raw_earnings = earnings_agg['earnings'] or Decimal('0.00')
        my_earnings = raw_earnings / Decimal('100.00')

        recent_order_ids = items.values_list('order', flat=True).distinct()[:10]
        recent_orders = Order.objects.filter(id__in=recent_order_ids).order_by('-created_at')

        total_products = products.count()
        requested_amount = Decimal('0.00')
        total_withdrawn = Decimal('0.00')

        return Response({
            'total_sales': total_sales,
            'my_earnings': my_earnings,
            'total_products': total_products,
            'pending_amount': my_earnings - requested_amount,
            'total_withdrawn': total_withdrawn,
            'total_orders': sales_items.values('order').distinct().count(),
            'delivered_orders': items.filter(order__status__in=['delivered', 'completed']).values('order').distinct().count(),
            'returned_orders': items.filter(order__status='returned').values('order').distinct().count(),
            'recent_orders': OrderSerializer(recent_orders, many=True, context={'request': request}).data
        })


class PartnerShopListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        shops = get_partner_catalog_shops(request.user).order_by('name')
        serializer = ShopSerializer(shops, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ShopSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        approval_status = 'approved' if request.user.is_superuser else 'pending'
        shop = serializer.save(
            owner=request.user,
            approval_status=approval_status,
            is_active=approval_status == 'approved',
        )
        return Response(
            ShopSerializer(shop, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PartnerCategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flat = request.query_params.get('flat') == 'true'
        search = request.query_params.get('search')
        queryset = Category.objects.filter(is_active=True).order_by('name')
        
        if not flat and not search:
            queryset = queryset.filter(parent=None)
            
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
            
        serializer = CategorySerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        category = serializer.save(is_active=True)
        return Response(
            CategorySerializer(category, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PartnerProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = get_partner_products(request.user).order_by('-created_at')

        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        status = request.query_params.get('approval_status')
        if status:
            queryset = queryset.filter(approval_status=status)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)

        serializer = ProductSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        approval_status = 'approved' if request.user.is_superuser else 'pending'
        serializer.save(created_by=request.user, approval_status=approval_status)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PartnerProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(get_partner_products(request.user), pk=pk)

    def get(self, request, pk):
        product = self.get_object(request, pk)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        product = self.get_object(request, pk)
        serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        product = self.get_object(request, pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PayoutRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payout Requests.
    - Partners can list their own requests and create new ones.
    - Admins can list all and update status.
    """
    queryset = PayoutRequest.objects.all()
    serializer_class = PayoutRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or (user.is_staff and not is_partner_user(user)):
            return PayoutRequest.objects.all().order_by('-requested_at')

        partner_shops = get_partner_payout_shops(user)
        return PayoutRequest.objects.filter(shop__in=partner_shops).order_by('-requested_at')

    def perform_create(self, serializer):
        user = self.request.user
        shop = get_partner_payout_shops(user).first()
        if not shop:
            raise serializers.ValidationError({"error": "Create a product with a shop selected before requesting a payout."})
        
        serializer.save(
            shop=shop,
            status='pending' 
        )

    def perform_update(self, serializer):
        # Only admins can update status/transaction_id
        user = self.request.user
        if not user.is_superuser and not (user.is_staff and not is_partner_user(user)):
            # If partner tries to update, prevent status change
            if 'status' in serializer.validated_data or 'transaction_id' in serializer.validated_data:
                raise serializers.ValidationError({"error": "You cannot change the status of a payout request."})
        
        if serializer.validated_data.get('status') == 'paid':
             processed_at = serializer.validated_data.get('processed_at') or timezone.now()
             serializer.save(processed_at=processed_at)
        else:
             serializer.save()

class AdminGoogleMerchantView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get Google Merchant sync stats."""
        total = Product.objects.count()
        synced = Product.objects.filter(google_merchant_status='synced').count()
        failed = Product.objects.filter(google_merchant_status='failed').count()
        pending = Product.objects.filter(google_merchant_status='pending').count()
        
        return Response({
            'total': total,
            'synced': synced,
            'failed': failed,
            'pending': pending,
            'is_configured': bool(getattr(settings, 'GOOGLE_MERCHANT_ID', None))
        })

    def post(self, request):
        """Trigger bulk sync."""
        from django.core.management import call_command
        import threading
        
        try:
            # Run bulk sync in a background thread to avoid timeout
            thread = threading.Thread(target=call_command, args=('sync_google_merchant',))
            thread.start()
            return Response({'message': 'Bulk sync triggered successfully in background'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleMerchantFeedView(APIView):
    """
    Public XML feed for Google Merchant Center.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_active=True, approval_status='approved').select_related('shop')
        
        frontend_url = getattr(settings, 'APP_URL', 'https://vorionmart.com').rstrip('/')
        base_url = request.build_absolute_uri('/') .rstrip('/')
        
        context = {
            'products': products,
            'frontend_url': frontend_url,
            'base_url': base_url,
        }
        
        xml_content = render_to_string('google_merchant_feed.xml', context)
        return HttpResponse(xml_content, content_type='application/xml')

class BlogPostViewSet(viewsets.ModelViewSet):
    """ViewSet for blog posts."""
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def generate_from_product(self, request):
        """Action to generate a blog post from a product using AI."""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Start AI generation
        ai_service = GeminiBlogService()
        blog_data, error = ai_service.generate_complete_blog(product)
        
        if error:
            return Response({"error": error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create blog post
        blog_post = BlogPost.objects.create(
            title=blog_data['title'],
            content=blog_data['content'],
            excerpt=blog_data['excerpt'],
            meta_title=blog_data['title'],
            meta_description=blog_data['meta_description'],
            keywords=blog_data['keywords'],
            ai_generated=True
        )
        blog_post.related_products.add(product)
        
        serializer = self.get_serializer(blog_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

