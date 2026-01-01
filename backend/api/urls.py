"""
URL configuration for Markexo API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Public views
    ShopViewSet, CategoryViewSet, ProductViewSet,
    BannerListView, SiteSettingView, CreateOrderView, OrderDetailView, CreateEnquiryView,
    # Admin views
    AdminDashboardStatsView, AdminShopViewSet, AdminCategoryViewSet,
    AdminProductViewSet, AdminOrderViewSet, AdminCustomerViewSet,
    AdminBannerViewSet, AdminSiteSettingView, AdminSubscriptionViewSet,
    AdminEnquiryViewSet, AdminUserViewSet, AdminRoleViewSet, PermissionListView
)

# Public router
router = DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'shops', AdminShopViewSet, basename='admin-shop')
admin_router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
admin_router.register(r'products', AdminProductViewSet, basename='admin-product')
admin_router.register(r'orders', AdminOrderViewSet, basename='admin-order')
admin_router.register(r'customers', AdminCustomerViewSet, basename='admin-customer')
admin_router.register(r'banners', AdminBannerViewSet, basename='admin-banner')
admin_router.register(r'subscriptions', AdminSubscriptionViewSet, basename='admin-subscription')
admin_router.register(r'enquiries', AdminEnquiryViewSet, basename='admin-enquiry')
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'roles', AdminRoleViewSet, basename='admin-role')

urlpatterns = [
    # Public API
    path('', include(router.urls)),
    path('banners/', BannerListView.as_view(), name='banners'),
    path('settings/', SiteSettingView.as_view(), name='settings'),
    path('orders/create/', CreateOrderView.as_view(), name='create-order'),
    path('orders/<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('enquiries/', CreateEnquiryView.as_view(), name='create-enquiry'),

    # Admin API
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/settings/', AdminSiteSettingView.as_view(), name='admin-settings'),
    path('admin/permissions/', PermissionListView.as_view(), name='admin-permissions'),
    path('admin/', include(admin_router.urls)),
]
