from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from api.models import Category, Customer, Product, Review
from api.serializers import CustomTokenObtainPairSerializer, RegistrationSerializer, ReviewSerializer


class CustomerLinkingTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.category = Category.objects.create(name='Apparel')
        self.product = Product.objects.create(
            name='Review Target',
            description='Test product',
            category=self.category,
            price=100,
            stock=5,
        )

    def test_review_submission_links_existing_customer_by_email(self):
        user = User.objects.create_user(
            username='afsal123',
            email='afsalat9@gmail.com',
            password='strong-pass-123',
            is_staff=True,
        )
        customer = Customer.objects.create(
            email='afsalat9@gmail.com',
            name='Afsal At',
            phone='',
            city='',
            pincode='',
        )

        request = self.factory.post('/api/reviews/')
        request.user = user

        serializer = ReviewSerializer(
            data={'product': self.product.id, 'rating': 5, 'comment': 'nice'},
            context={'request': request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        review = serializer.save()

        customer.refresh_from_db()
        self.assertEqual(review.customer_id, customer.id)
        self.assertEqual(customer.user_id, user.id)
        self.assertTrue(Review.objects.filter(product=self.product, customer=customer).exists())

    def test_login_response_uses_linked_customer_profile(self):
        user = User.objects.create_user(
            username='afsal123',
            email='afsalat9@gmail.com',
            password='strong-pass-123',
            first_name='Wrong',
            last_name='Name',
            is_staff=True,
        )
        customer = Customer.objects.create(
            email='afsalat9@gmail.com',
            name='Afsal At',
            phone='9876543210',
            city='',
            pincode='',
        )

        serializer = CustomTokenObtainPairSerializer(
            data={'email': 'afsalat9@gmail.com', 'password': 'strong-pass-123'}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        data = serializer.validated_data

        customer.refresh_from_db()
        self.assertEqual(customer.user_id, user.id)
        self.assertEqual(data['user']['name'], 'Afsal At')
        self.assertEqual(data['user']['phone'], '9876543210')

    def test_registration_serializer_creates_customer_with_phone(self):
        serializer = RegistrationSerializer(data={
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'phone': '9876543210',
            'password': 'strong-pass-123',
            'password_confirm': 'strong-pass-123',
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        customer = Customer.objects.get(user=user)
        self.assertEqual(customer.phone, '9876543210')
        self.assertEqual(customer.email, 'newuser@example.com')
