from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import Category, Customer, Order, OrderItem, Product, Shop


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='test@example.com',
)
class OrderMetricsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Electronics')
        self.shop = Shop.objects.create(
            name='Metric Shop',
            description='Metrics catalog',
            address='Market road',
            city='Kochi',
            phone='9999999999',
            email='metrics@example.com',
        )
        self.partner_user = User.objects.create_user(
            username='partner-metrics',
            email='partner-metrics@example.com',
            password='strong-pass-123',
            first_name='Partner',
            last_name='Metrics',
        )
        self.admin_user = User.objects.create_superuser(
            username='admin-metrics',
            email='admin-metrics@example.com',
            password='strong-pass-123',
        )
        self.customer = Customer.objects.create(
            name='Buyer',
            email='buyer@example.com',
            phone='9876543210',
            city='Kochi',
            pincode='682001',
            address='MG Road',
        )
        self.product = Product.objects.create(
            name='Metric Product',
            description='Dashboard test product',
            category=self.category,
            shop=self.shop,
            created_by=self.partner_user,
            supplier_price=Decimal('100.00'),
            our_price=Decimal('150.00'),
            price=Decimal('150.00'),
            stock=25,
        )

    def create_order(self, *, status, quantity, total_amount):
        order = Order.objects.create(
            customer=self.customer,
            total_amount=Decimal(total_amount),
            status=status,
            payment_status='received' if status in {'delivered', 'completed'} else 'pending_cod',
            delivery_address='MG Road',
            delivery_city='Kochi',
            delivery_pincode='682001',
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            shop=self.shop,
            product_name=self.product.name,
            quantity=quantity,
            price=Decimal('150.00'),
        )
        return order

    def test_customer_cancellation_rolls_back_product_sold_count(self):
        payload = {
            'customer_name': 'Buyer',
            'customer_email': 'buyer@example.com',
            'customer_phone': '9876543210',
            'delivery_address': 'MG Road',
            'delivery_city': 'Kochi',
            'delivery_pincode': '682001',
            'items': [
                {'product_id': self.product.id, 'quantity': 2},
            ],
        }

        response = self.client.post('/api/orders/create/', payload, format='json')

        self.assertEqual(response.status_code, 201, response.content)
        self.product.refresh_from_db()
        self.assertEqual(self.product.sold_count, 2)

        cancel_response = self.client.post(
            f"/api/orders/{response.data['order_id']}/cancel/",
            {
                'customer_email': 'buyer@example.com',
                'reason': 'Changed mind',
            },
            format='json',
        )

        self.assertEqual(cancel_response.status_code, 200, cancel_response.content)
        self.product.refresh_from_db()
        self.assertEqual(self.product.sold_count, 0)

    def test_cancelled_orders_are_excluded_from_admin_and_partner_sales_metrics(self):
        self.create_order(status='delivered', quantity=1, total_amount='150.00')
        self.create_order(status='cancelled', quantity=3, total_amount='450.00')

        self.client.force_authenticate(user=self.admin_user)

        stats_response = self.client.get('/api/admin/stats/')
        self.assertEqual(stats_response.status_code, 200, stats_response.content)
        self.assertEqual(Decimal(str(stats_response.data['total_revenue'])), Decimal('150.00'))
        self.assertEqual(Decimal(str(stats_response.data['total_profit'])), Decimal('50.00'))
        self.assertEqual(sum(day['revenue'] for day in stats_response.data['revenue_history']), 150.0)

        analytics_response = self.client.get('/api/admin/analytics/')
        self.assertEqual(analytics_response.status_code, 200, analytics_response.content)
        most_ordered = analytics_response.data['most_ordered']
        self.assertTrue(most_ordered)
        self.assertEqual(most_ordered[0]['id'], self.product.id)
        self.assertEqual(most_ordered[0]['sold_count'], 1)

        self.client.force_authenticate(user=self.partner_user)
        partner_stats_response = self.client.get('/api/partner/stats/')
        self.assertEqual(partner_stats_response.status_code, 200, partner_stats_response.content)
        self.assertEqual(Decimal(str(partner_stats_response.data['total_sales'])), Decimal('150.00'))
        self.assertEqual(Decimal(str(partner_stats_response.data['my_earnings'])), Decimal('15.00'))
        self.assertEqual(partner_stats_response.data['total_orders'], 1)
        self.assertEqual(partner_stats_response.data['delivered_orders'], 1)
