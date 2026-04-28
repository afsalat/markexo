"""
URL configuration for VorionMart API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    # Public views
    CategoryViewSet, ProductViewSet, ReviewViewSet,
    BannerListView, SiteSettingView, CreateOrderView, OrderDetailView, CancelOrderView, ReturnOrderView, CreateEnquiryView,
    CartAPIView, RegisterUserView, RegisterPartnerView, CustomTokenObtainPairView, CustomerOrdersView, TwilioWhatsAppWebhookView, SocialLoginView,
    # Admin views
    AdminDashboardStatsView, AdminShopViewSet, AdminCategoryViewSet,
    AdminProductViewSet, AdminOrderViewSet, AdminCustomerViewSet,
    AdminBannerViewSet, AdminSiteSettingView,
    AdminBannerViewSet, AdminSiteSettingView,
    AdminEnquiryViewSet, AdminUserViewSet, AdminRoleViewSet, PermissionListView, AdminAnalyticsView, AdminSystemLogsView,
    AdminLaunchChecklistView, AdminLaunchChecklistSectionCreateView, AdminLaunchChecklistSectionDetailView,
    AdminLaunchChecklistItemCreateView, AdminLaunchChecklistItemDetailView, AdminLaunchChecklistSeedView,
    AdminGoogleMerchantView,
    # Supplier API views
    AdminSupplierViewSet, OrderForwardLogViewSet, ForwardOrdersView, PendingOrdersForForwardingView,
    # Partner view
    PartnerDashboardStatsView, PartnerShopListView, PartnerCategoryListView, PartnerProductListView, PartnerProductDetailView,
    AdminPartnerViewSet, PayoutRequestViewSet
)

# Public router
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'payouts', PayoutRequestViewSet, basename='payout')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'shops', AdminShopViewSet, basename='admin-shop')
admin_router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
admin_router.register(r'products', AdminProductViewSet, basename='admin-product')
admin_router.register(r'orders', AdminOrderViewSet, basename='admin-order')
admin_router.register(r'customers', AdminCustomerViewSet, basename='admin-customer')
admin_router.register(r'banners', AdminBannerViewSet, basename='admin-banner')
admin_router.register(r'enquiries', AdminEnquiryViewSet, basename='admin-enquiry')
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'roles', AdminRoleViewSet, basename='admin-role')
admin_router.register(r'suppliers', AdminSupplierViewSet, basename='admin-supplier')
admin_router.register(r'forward-logs', OrderForwardLogViewSet, basename='admin-forward-log')
admin_router.register(r'partners', AdminPartnerViewSet, basename='admin-partner')

urlpatterns = [
    # Public API
    path('', include(router.urls)),
    path('banners/', BannerListView.as_view(), name='banners'),
    path('settings/', SiteSettingView.as_view(), name='settings'),
    path('orders/create/', CreateOrderView.as_view(), name='create-order'),
    path('orders/my-orders/', CustomerOrdersView.as_view(), name='customer-orders'),
    path('orders/<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/cancel/', CancelOrderView.as_view(), name='cancel-order'),
    path('orders/<str:order_id>/return/', ReturnOrderView.as_view(), name='return-order'),
    path('integrations/twilio/whatsapp/webhook/', TwilioWhatsAppWebhookView.as_view(), name='twilio-whatsapp-webhook'),
    path('enquiries/', CreateEnquiryView.as_view(), name='create-enquiry'),
    path('cart/', CartAPIView.as_view(), name='cart'),
    
    # Auth API
    path('auth/register/', RegisterUserView.as_view(), name='register'),
    path('auth/register-partner/', RegisterPartnerView.as_view(), name='register-partner'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/social-login/', SocialLoginView.as_view(), name='social-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Partner API
    path('partner/stats/', PartnerDashboardStatsView.as_view(), name='partner-stats'),
    path('partner/shops/', PartnerShopListView.as_view(), name='partner-shops'),
    path('partner/categories/', PartnerCategoryListView.as_view(), name='partner-categories'),
    path('partner/products/', PartnerProductListView.as_view(), name='partner-products'),
    path('partner/products/<int:pk>/', PartnerProductDetailView.as_view(), name='partner-product-detail'),

    # Admin API
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/partner-stats/', PartnerDashboardStatsView.as_view(), name='admin-partner-stats'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/settings/', AdminSiteSettingView.as_view(), name='admin-settings'),
    path('admin/system-logs/', AdminSystemLogsView.as_view(), name='admin-system-logs'),
    path('admin/permissions/', PermissionListView.as_view(), name='admin-permissions'),
    path('admin/launch-checklist/', AdminLaunchChecklistView.as_view(), name='admin-launch-checklist'),
    path('admin/launch-checklist/seed/', AdminLaunchChecklistSeedView.as_view(), name='admin-launch-checklist-seed'),
    path('admin/launch-checklist/sections/', AdminLaunchChecklistSectionCreateView.as_view(), name='admin-launch-checklist-section-create'),
    path('admin/launch-checklist/sections/<int:pk>/', AdminLaunchChecklistSectionDetailView.as_view(), name='admin-launch-checklist-section-detail'),
    path('admin/launch-checklist/items/', AdminLaunchChecklistItemCreateView.as_view(), name='admin-launch-checklist-item-create'),
    path('admin/launch-checklist/items/<int:pk>/', AdminLaunchChecklistItemDetailView.as_view(), name='admin-launch-checklist-item-detail'),
    path('admin/forward-orders/', ForwardOrdersView.as_view(), name='forward-orders'),
    path('admin/pending-orders-for-forwarding/', PendingOrdersForForwardingView.as_view(), name='pending-orders-for-forwarding'),
    path('admin/google-merchant/', AdminGoogleMerchantView.as_view(), name='admin-google-merchant'),
    path('admin/', include(admin_router.urls)),
]
