from decimal import Decimal

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import Category, Customer, Order, OrderItem, Product, Shop


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='test@example.com',
)
class OrderEmailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Safety')
        self.shop = Shop.objects.create(
            name='Safety Source',
            description='Safety catalog',
            address='Market road',
            city='Kochi',
            phone='8888888888',
            email='shop@example.com',
        )
        self.product = Product.objects.create(
            name='Socket Safety Cover',
            description='Safety cap for sockets',
            category=self.category,
            shop=self.shop,
            supplier_price=Decimal('50.00'),
            our_price=Decimal('99.00'),
            price=Decimal('99.00'),
            stock=10,
        )
        self.customer = Customer.objects.create(
            name='Buyer',
            email='buyer@example.com',
            phone='9876543210',
            city='Kochi',
            pincode='682001',
            address='MG Road',
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='strong-pass-123',
        )

    def test_create_order_sends_customer_email(self):
        payload = {
            'customer_name': 'Buyer',
            'customer_email': 'buyer@example.com',
            'customer_phone': '9876543210',
            'delivery_address': 'MG Road',
            'delivery_city': 'Kochi',
            'delivery_pincode': '682001',
            'items': [
                {'product_id': self.product.id, 'quantity': 1},
            ],
        }

        response = self.client.post('/api/orders/create/', payload, format='json')

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['buyer@example.com'])
        self.assertIn(response.data['order_id'], mail.outbox[0].subject)
        self.assertIn('Socket Safety Cover', mail.outbox[0].body)
        self.assertIn('Pending Verification', mail.outbox[0].body)

    def test_admin_status_update_sends_customer_email(self):
        order = Order.objects.create(
            customer=self.customer,
            total_amount=Decimal('99.00'),
            status='pending_verification',
            payment_status='pending_cod',
            delivery_address='MG Road',
            delivery_city='Kochi',
            delivery_pincode='682001',
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            shop=self.shop,
            product_name=self.product.name,
            quantity=1,
            price=Decimal('99.00'),
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/admin/orders/{order.id}/update_status/',
            {'status': 'shipped'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['buyer@example.com'])
        self.assertIn(order.order_id, mail.outbox[0].subject)
        self.assertIn('Shipped', mail.outbox[0].body)
        self.assertIn('Socket Safety Cover', mail.outbox[0].body)

    def test_customer_return_request_sends_confirmation_email(self):
        order = Order.objects.create(
            customer=self.customer,
            total_amount=Decimal('99.00'),
            status='delivered',
            payment_status='received',
            delivery_address='MG Road',
            delivery_city='Kochi',
            delivery_pincode='682001',
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            shop=self.shop,
            product_name=self.product.name,
            quantity=1,
            price=Decimal('99.00'),
        )

        response = self.client.post(
            f'/api/orders/{order.order_id}/return/',
            {
                'customer_email': 'buyer@example.com',
                'reason': 'Received damaged item',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(mail.outbox), 2)
        self.assertIn(order.order_id, mail.outbox[0].subject)
        self.assertIn('Return Request Received', mail.outbox[0].subject)
        self.assertIn('Received damaged item', mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ['buyer@example.com'])
