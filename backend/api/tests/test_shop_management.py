from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from api.models import Category, Customer, Order, OrderItem, Partner, Product, Shop
from api.serializers import ShopSerializer


class ShopManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Shirts')
        self.partner_user = User.objects.create_user(
            username='partner-user',
            email='partner@example.com',
            password='strong-pass-123',
            first_name='Sourcing',
            last_name='Partner',
        )
        self.partner = Partner.objects.create(
            user=self.partner_user,
            phone='9999999999',
            city='Kochi',
        )
        self.second_partner_user = User.objects.create_user(
            username='partner-user-2',
            email='partner2@example.com',
            password='strong-pass-123',
            first_name='Hari',
            last_name='Krishna',
        )
        self.second_partner = Partner.objects.create(
            user=self.second_partner_user,
            phone='8888877777',
            city='Pune',
        )
        self.shop = Shop.objects.create(
            name='Alpha Source',
            description='Source catalog',
            address='Market road',
            city='Kochi',
            phone='8888888888',
            email='alpha@example.com',
            shop_type='b2b_ecommerce',
            source_platform='IndiaMART',
            sourcing_partner=self.partner,
        )
        self.shop.sourcing_partners.add(self.partner)
        self.product = Product.objects.create(
            name='Blue Shirt',
            description='Cotton shirt',
            category=self.category,
            shop=self.shop,
            supplier_price=Decimal('125.00'),
            our_price=Decimal('199.00'),
            price=Decimal('199.00'),
            stock=10,
        )
        self.customer = Customer.objects.create(
            name='Buyer',
            email='buyer@example.com',
            phone='9876543210',
            city='Kochi',
            pincode='682001',
        )

    def test_shop_serializer_reports_partner_and_pending_payment(self):
        pending_order = Order.objects.create(
            customer=self.customer,
            total_amount=Decimal('398.00'),
            status='processing',
            payment_status='pending_cod',
            delivery_address='Addr',
            delivery_city='Kochi',
            delivery_pincode='682001',
        )
        OrderItem.objects.create(
            order=pending_order,
            product=self.product,
            shop=self.shop,
            product_name=self.product.name,
            quantity=2,
            price=Decimal('199.00'),
        )
        settled_order = Order.objects.create(
            customer=self.customer,
            total_amount=Decimal('199.00'),
            status='delivered',
            payment_status='paid',
            delivery_address='Addr',
            delivery_city='Kochi',
            delivery_pincode='682001',
        )
        OrderItem.objects.create(
            order=settled_order,
            product=self.product,
            shop=self.shop,
            product_name=self.product.name,
            quantity=1,
            price=Decimal('199.00'),
        )

        data = ShopSerializer(self.shop).data

        self.assertEqual(data['shop_type'], 'b2b_ecommerce')
        self.assertEqual(data['sourcing_partner_name'], 'Sourcing Partner')
        self.assertEqual(data['sourcing_partner_email'], 'partner@example.com')
        self.assertEqual(Decimal(str(data['pending_payment'])), Decimal('250.00'))
        self.assertEqual(data['pending_order_count'], 1)

    def test_shop_serializer_accepts_user_ids_and_multiple_partners(self):
        serializer = ShopSerializer(
            instance=self.shop,
            data={
                'name': self.shop.name,
                'description': self.shop.description,
                'address': self.shop.address,
                'city': self.shop.city,
                'phone': self.shop.phone,
                'email': self.shop.email,
                'shop_type': self.shop.shop_type,
                'source_platform': self.shop.source_platform,
                'sourcing_partner_ids': [self.partner_user.id, self.second_partner.id],
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        shop = serializer.save()

        self.assertEqual(shop.sourcing_partner_id, self.partner.id)
        self.assertEqual(
            set(shop.sourcing_partners.values_list('id', flat=True)),
            {self.partner.id, self.second_partner.id},
        )

    def test_create_order_persists_shop_on_order_items(self):
        payload = {
            'customer_name': 'Buyer',
            'customer_email': 'buyer@example.com',
            'customer_phone': '9876543210',
            'delivery_address': 'Addr',
            'delivery_city': 'Kochi',
            'delivery_pincode': '682001',
            'items': [
                {'product_id': self.product.id, 'quantity': 1},
            ],
        }

        response = self.client.post('/api/orders/create/', payload, format='json')

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(order_id=response.data['order_id'])
        item = order.items.get()
        self.assertEqual(item.shop_id, self.shop.id)

    def test_create_order_reuses_existing_customer_when_duplicate_email_exists(self):
        duplicate_customer = Customer.objects.create(
            name='Buyer Duplicate',
            email='buyer@example.com',
            phone='9999999999',
            city='Thrissur',
            pincode='680001',
        )
        payload = {
            'customer_name': 'Buyer Updated',
            'customer_email': 'buyer@example.com',
            'customer_phone': '9876543210',
            'delivery_address': 'Addr',
            'delivery_city': 'Kochi',
            'delivery_pincode': '682001',
            'items': [
                {'product_id': self.product.id, 'quantity': 1},
            ],
        }

        response = self.client.post('/api/orders/create/', payload, format='json')

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(order_id=response.data['order_id'])
        self.assertIn(order.customer_id, {self.customer.id, duplicate_customer.id})
        self.assertEqual(order.customer.email, 'buyer@example.com')
