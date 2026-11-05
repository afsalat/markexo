"""
Unit tests for Meta Conversions API (CAPI) service, normalization, hashing, idempotency, and view integration.
"""
import hashlib
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from api.meta_capi_service import (
    extract_client_ip,
    extract_client_user_agent,
    hash_sha256,
    normalize_phone_for_meta,
    send_meta_purchase_event,
)
from api.models import Category, Customer, MetaEventLog, Order, OrderItem, Product, Shop


class MetaCapiNormalizationTests(TestCase):
    def test_hash_sha256(self):
        # Empty or whitespace returns None
        self.assertIsNone(hash_sha256(None))
        self.assertIsNone(hash_sha256(''))
        self.assertIsNone(hash_sha256('   '))

        # Normalizes to lowercase and trims whitespace
        expected = hashlib.sha256(b'test@example.com').hexdigest()
        self.assertEqual(hash_sha256('  Test@Example.COM  '), expected)

    def test_normalize_phone_for_meta(self):
        # Standard 10-digit Indian number prepends 91
        expected_hash = hashlib.sha256(b'919876543210').hexdigest()
        self.assertEqual(normalize_phone_for_meta('9876543210'), expected_hash)
        self.assertEqual(normalize_phone_for_meta('+91 98765-43210'), expected_hash)
        self.assertEqual(normalize_phone_for_meta('09876543210'), expected_hash)

        # Empty phone returns None
        self.assertIsNone(normalize_phone_for_meta(''))
        self.assertIsNone(normalize_phone_for_meta(None))

    def test_extract_client_ip(self):
        request = MagicMock()
        request.META = {'HTTP_X_FORWARDED_FOR': '203.0.113.195, 198.51.100.1'}
        self.assertEqual(extract_client_ip(request), '203.0.113.195')

        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        self.assertEqual(extract_client_ip(request), '127.0.0.1')


@override_settings(
    META_PIXEL_ID='888338177639026',
    META_CAPI_ACCESS_TOKEN='EAABtesttoken123',
    META_CAPI_TEST_EVENT_CODE='TEST99999',
    APP_URL='https://vorionmart.com'
)
class MetaCapiServiceTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            name='Rahul Sharma',
            email='rahul.sharma@example.com',
            phone='9876543210',
            address='123 Main Road',
            city='Kozhikode',
            pincode='673011'
        )
        self.shop = Shop.objects.create(name='Test Shop', slug='test-shop')
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(
            shop=self.shop,
            category=self.category,
            name='Wireless Mouse',
            slug='wireless-mouse',
            price=Decimal('599.00'),
            sale_price=Decimal('499.00'),
            stock=50,
            sku='WM-01'
        )
        self.order = Order.objects.create(
            order_id='AGV12345678',
            customer=self.customer,
            total_amount=Decimal('499.00'),
            status='pending_verification',
            payment_status='pending_cod',
            is_cod=True,
            delivery_address='123 Main Road',
            delivery_city='Kozhikode',
            delivery_pincode='673011'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name='Wireless Mouse',
            quantity=1,
            price=Decimal('499.00')
        )

    @patch('api.meta_capi_service.requests.post')
    def test_send_meta_purchase_event_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'events_received': 1,
            'messages': [],
            'fbtrace_id': 'trace_abc_123'
        }
        mock_post.return_value = mock_response

        res = send_meta_purchase_event(self.order)

        self.assertTrue(res['success'])
        self.assertEqual(res['fbtrace_id'], 'trace_abc_123')
        self.assertEqual(res['events_received'], 1)

        # Verify order updated
        self.order.refresh_from_db()
        self.assertTrue(self.order.meta_purchase_sent)
        self.assertIsNotNone(self.order.meta_purchase_sent_at)
        self.assertEqual(self.order.meta_purchase_fbtrace_id, 'trace_abc_123')

        # Verify audit log created
        log = MetaEventLog.objects.get(order=self.order)
        self.assertEqual(log.status, 'sent')
        self.assertEqual(log.event_id, 'AGV12345678')
        self.assertEqual(log.event_name, 'Purchase')
        self.assertEqual(log.fbtrace_id, 'trace_abc_123')

        # Verify payload sent to Meta
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        payload = kwargs['json']
        self.assertEqual(payload['test_event_code'], 'TEST99999')
        data = payload['data'][0]
        self.assertEqual(data['event_name'], 'Purchase')
        self.assertEqual(data['event_id'], 'AGV12345678')
        self.assertEqual(data['custom_data']['currency'], 'INR')
        self.assertEqual(data['custom_data']['value'], 499.0)
        self.assertEqual(data['custom_data']['payment_type'], 'cash_on_delivery')
        self.assertEqual(len(data['custom_data']['contents']), 1)
        self.assertEqual(data['custom_data']['contents'][0]['id'], str(self.product.id))

        # Verify user_data is hashed
        self.assertEqual(data['user_data']['em'], [hashlib.sha256(b'rahul.sharma@example.com').hexdigest()])
        self.assertEqual(data['user_data']['ph'], [hashlib.sha256(b'919876543210').hexdigest()])
        self.assertEqual(data['user_data']['fn'], [hashlib.sha256(b'rahul').hexdigest()])
        self.assertEqual(data['user_data']['ln'], [hashlib.sha256(b'sharma').hexdigest()])

    @patch('api.meta_capi_service.requests.post')
    def test_idempotency_prevents_duplicate_dispatch(self, mock_post):
        # Mark order as already sent
        self.order.meta_purchase_sent = True
        self.order.save(update_fields=['meta_purchase_sent'])

        res = send_meta_purchase_event(self.order)

        self.assertTrue(res['success'])
        self.assertTrue(res['skipped'])
        self.assertEqual(res['reason'], 'already_sent')
        # Meta API must NOT have been called
        mock_post.assert_not_called()

    @patch('api.meta_capi_service.requests.post')
    def test_rejected_event_does_not_mark_order_sent(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = '{"error":{"message":"Invalid parameter"}}'
        mock_response.json.return_value = {
            'error': {'message': 'Invalid parameter'}
        }
        mock_post.return_value = mock_response

        res = send_meta_purchase_event(self.order)

        self.assertFalse(res['success'])
        self.assertEqual(res['response_code'], 400)

        # Order must NOT be marked sent
        self.order.refresh_from_db()
        self.assertFalse(self.order.meta_purchase_sent)

        # Failed audit log must be recorded
        log = MetaEventLog.objects.get(order=self.order)
        self.assertEqual(log.status, 'failed')
        self.assertEqual(log.response_code, 400)

    @patch('api.meta_capi_service.requests.post')
    def test_network_timeout_does_not_crash(self, mock_post):
        import requests
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")

        res = send_meta_purchase_event(self.order)

        self.assertFalse(res['success'])
        self.assertIn("Network exception", res['error'])

        # Order must NOT be marked sent
        self.order.refresh_from_db()
        self.assertFalse(self.order.meta_purchase_sent)

        # Failed audit log recorded
        log = MetaEventLog.objects.get(order=self.order)
        self.assertEqual(log.status, 'failed')


class MetaCapiViewIntegrationTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(
            name='Afsal At',
            email='afsal@example.com',
            phone='9876543210',
            address='Calicut Road',
            city='Kozhikode',
            pincode='673011'
        )
        self.shop = Shop.objects.create(name='Shop 1', slug='shop-1')
        self.category = Category.objects.create(name='Gadgets', slug='gadgets')
        self.product = Product.objects.create(
            shop=self.shop,
            category=self.category,
            name='Smart Watch',
            slug='smart-watch',
            price=Decimal('1299.00'),
            sale_price=Decimal('999.00'),
            stock=25,
            sku='SW-01'
        )

    @patch('api.views.send_meta_purchase_event')
    def test_cod_order_triggers_meta_capi_purchase(self, mock_send_capi):
        from rest_framework.test import APIClient
        client = APIClient()

        order_data = {
            'customer_name': 'Afsal At',
            'customer_email': 'afsal@example.com',
            'customer_phone': '9876543210',
            'delivery_address': 'Calicut Road',
            'delivery_city': 'Kozhikode',
            'delivery_pincode': '673011',
            'is_cod': True,
            'payment_method': 'cod',
            'items': [
                {'product_id': self.product.id, 'quantity': 1}
            ]
        }

        res = client.post('/api/orders/create/', order_data, format='json')
        self.assertEqual(res.status_code, 201)

        # Ensure Meta CAPI purchase event was dispatched for this COD order
        mock_send_capi.assert_called_once()
        created_order = Order.objects.get(order_id=res.data['order_id'])
        call_args, call_kwargs = mock_send_capi.call_args
        self.assertEqual(call_args[0], created_order)

    @patch('api.views.send_meta_purchase_event')
    @patch('api.views.verify_cashfree_order')
    def test_cashfree_verify_triggers_meta_capi_purchase_when_paid(self, mock_cf_verify, mock_send_capi):
        from rest_framework.test import APIClient
        client = APIClient()

        order = Order.objects.create(
            order_id='AGV99887766',
            customer=self.customer,
            total_amount=Decimal('999.00'),
            status='pending',
            payment_status='pending',
            is_cod=False,
            delivery_address='Calicut Road',
            delivery_city='Kozhikode',
            delivery_pincode='673011'
        )

        mock_cf_verify.return_value = {
            'success': True,
            'is_paid': True,
            'cf_order_id': 'CF12345678',
            'payment_status': 'PAID'
        }

        res = client.post('/api/payments/cashfree/verify/', {'order_id': order.order_id}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_paid'])

        # Meta CAPI purchase event must be triggered
        mock_send_capi.assert_called_once()
        call_args, call_kwargs = mock_send_capi.call_args
        self.assertEqual(call_args[0], order)

    @patch('api.views.send_meta_purchase_event')
    def test_cashfree_webhook_triggers_meta_capi_purchase(self, mock_send_capi):
        from rest_framework.test import APIClient
        client = APIClient()

        order = Order.objects.create(
            order_id='AGV55443322',
            customer=self.customer,
            total_amount=Decimal('999.00'),
            status='pending',
            payment_status='pending',
            is_cod=False,
            delivery_address='Calicut Road',
            delivery_city='Kozhikode',
            delivery_pincode='673011'
        )

        webhook_data = {
            'data': {
                'order': {'order_id': order.order_id},
                'payment': {'payment_status': 'PAID'}
            }
        }

        res = client.post('/api/payments/cashfree/webhook/', webhook_data, format='json')
        self.assertEqual(res.status_code, 200)

        # Meta CAPI purchase event must be triggered from webhook
        mock_send_capi.assert_called_once()
        call_args, call_kwargs = mock_send_capi.call_args
        self.assertEqual(call_args[0], order)

