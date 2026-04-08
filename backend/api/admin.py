"""
Django admin configuration for VorionMart.
"""
from django.contrib import admin
from .models import (
    Shop, Category, Product, ProductImage, Customer,
    Order, OrderItem, Banner, SiteSetting, Partner
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'price']


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'phone', 'is_active']
    list_filter = ['is_active', 'city']
    search_fields = ['name', 'address']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active']
    list_filter = ['is_active', 'parent']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'shop', 'category', 'price', 'sale_price', 'stock', 'is_featured', 'is_active', 'meesho_url']
    list_filter = ['is_active', 'is_featured', 'shop', 'category']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'city', 'soft_block', 'created_at']
    list_filter = ['soft_block', 'city']
    search_fields = ['name', 'email', 'phone']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer', 'total_amount', 'status', 'payment_status', 'is_cod', 'meesho_order_id', 'created_at']
    list_filter = ['status', 'payment_status', 'is_cod', 'created_at']
    search_fields = ['order_id', 'customer__name', 'customer__email', 'meesho_order_id']
    inlines = [OrderItemInline]
    readonly_fields = ['order_id']


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'section', 'is_active', 'order']
    list_filter = ['section', 'is_active']
    list_editable = ['is_active', 'order']


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ['site_name', 'contact_email']


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'get_name', 'phone', 'designation', 'assigned_shop', 'commission_rate', 'is_active', 'date_of_joining']
    list_filter = ['is_active', 'assigned_shop', 'designation']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'employee_id', 'phone']
    readonly_fields = ['employee_id', 'date_of_joining', 'created_at', 'updated_at']
    
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'employee_id')
        }),
        ('Personal Details', {
            'fields': ('phone', 'alternate_phone', 'profile_image', 'address', 'city', 'pincode', 'date_of_birth')
        }),
        ('Employment', {
            'fields': ('designation', 'assigned_shop', 'commission_rate', 'date_of_joining', 'is_active')
        }),
        ('Banking Details', {
            'fields': ('bank_name', 'account_number', 'ifsc_code', 'upi_id', 'pan_number')
        }),
        ('Admin', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
    
    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_name.short_description = 'Name'
