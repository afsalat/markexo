import shutil
import tempfile

from django.contrib.auth.models import User
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APIRequestFactory

from api.models import Category, Customer, Product, Review
from api.serializers import CustomTokenObtainPairSerializer, RegistrationSerializer, ReviewSerializer


class CustomerLinkingTests(TestCase):
    VALID_GIF_BYTES = (
        b'GIF87a\x01\x00\x01\x00\x80\x00\x00'
        b'\x00\x00\x00\xff\xff\xff!'
        b'\xf9\x04\x01\x00\x00\x00\x00,'
        b'\x00\x00\x00\x00\x01\x00\x01\x00'
        b'\x00\x02\x02L\x01\x00;'
    )

    def setUp(self):
        self.factory = APIRequestFactory()
        self.client = APIClient()
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

    def test_review_submission_accepts_images(self):
        temp_media_root = tempfile.mkdtemp()
        self.addCleanup(lambda: shutil.rmtree(temp_media_root, ignore_errors=True))

        with override_settings(MEDIA_ROOT=temp_media_root):
            user = User.objects.create_user(
                username='reviewer@example.com',
                email='reviewer@example.com',
                password='strong-pass-123',
                is_staff=True,
            )
            Customer.objects.create(
                email='reviewer@example.com',
                name='Reviewer',
                phone='9999999999',
                city='',
                pincode='',
            )

            self.client.force_authenticate(user=user)
            image = SimpleUploadedFile(
                'review-photo.gif',
                self.VALID_GIF_BYTES,
                content_type='image/gif',
            )

            response = self.client.post(
                reverse('review-list'),
                {
                    'product': self.product.id,
                    'rating': 5,
                    'comment': 'Includes images',
                    'images': [image],
                },
                format='multipart',
            )

            self.assertEqual(response.status_code, 201, response.data)
            self.assertEqual(len(response.data['images']), 1)
            self.assertTrue(response.data['images'][0]['image'].endswith('.gif'))

    def test_review_resubmission_updates_existing_review_images(self):
        temp_media_root = tempfile.mkdtemp()
        self.addCleanup(lambda: shutil.rmtree(temp_media_root, ignore_errors=True))

        with override_settings(MEDIA_ROOT=temp_media_root):
            user = User.objects.create_user(
                username='update-reviewer@example.com',
                email='update-reviewer@example.com',
                password='strong-pass-123',
                is_staff=True,
            )
            customer = Customer.objects.create(
                email='update-reviewer@example.com',
                name='Update Reviewer',
                phone='9999999999',
                city='',
                pincode='',
            )
            Review.objects.create(
                product=self.product,
                customer=customer,
                rating=4,
                comment='Old comment',
            )

            self.client.force_authenticate(user=user)
            image = SimpleUploadedFile(
                'updated-review-photo.gif',
                self.VALID_GIF_BYTES,
                content_type='image/gif',
            )

            response = self.client.post(
                reverse('review-list'),
                {
                    'product': self.product.id,
                    'rating': 5,
                    'comment': 'Updated with image',
                    'uploaded_images': [image],
                },
                format='multipart',
            )

            self.assertEqual(response.status_code, 201, response.data)
            self.assertEqual(Review.objects.filter(product=self.product, customer=customer).count(), 1)

            review = Review.objects.get(product=self.product, customer=customer)
            self.assertEqual(review.rating, 5)
            self.assertEqual(review.comment, 'Updated with image')
            self.assertEqual(review.images.count(), 1)
