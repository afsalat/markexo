from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import ChecklistItem, ChecklistSection


@override_settings(
    MIDDLEWARE=[middleware for middleware in settings.MIDDLEWARE if 'whitenoise' not in middleware],
    STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage',
)
class LaunchChecklistAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='launch-admin',
            email='launch-admin@example.com',
            password='strong-pass-123',
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_get_launch_checklist_auto_seeds_nested_sections(self):
        response = self.client.get('/api/admin/launch-checklist/')

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data['project_name'], 'Vorionmart')
        self.assertGreater(len(response.data['sections']), 0)
        self.assertTrue(ChecklistSection.objects.exists())
        self.assertTrue(ChecklistItem.objects.exists())
        self.assertIn('items', response.data['sections'][0])

    def test_patch_launch_checklist_item_updates_completion_state(self):
        seed_response = self.client.get('/api/admin/launch-checklist/')
        first_item = seed_response.data['sections'][0]['items'][0]

        response = self.client.patch(
            f"/api/admin/launch-checklist/items/{first_item['id']}/",
            {'status': 'Completed', 'notes': 'Verified in QA rehearsal.'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data['status'], 'Completed')
        self.assertTrue(response.data['is_completed'])
        self.assertEqual(response.data['notes'], 'Verified in QA rehearsal.')

        item = ChecklistItem.objects.get(pk=first_item['id'])
        self.assertEqual(item.status, 'Completed')
        self.assertTrue(item.is_completed)

    def test_create_launch_checklist_item_under_existing_section(self):
        seed_response = self.client.get('/api/admin/launch-checklist/')
        section = seed_response.data['sections'][0]

        response = self.client.post(
            '/api/admin/launch-checklist/items/',
            {
                'section': section['id'],
                'title': 'Launch war room owner assigned',
                'description': 'Assign one person to own launch-day issue triage.',
                'priority': 'Critical',
                'status': 'Testing',
                'owner': 'Founder',
                'notes': 'Prepared for launch weekend.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data['title'], 'Launch war room owner assigned')
        self.assertEqual(response.data['priority'], 'Critical')
        self.assertEqual(response.data['status'], 'Testing')
        self.assertFalse(response.data['is_completed'])

    def test_create_section_rejects_duplicate_title_case_insensitive(self):
        self.client.get('/api/admin/launch-checklist/')
        response = self.client.post(
            '/api/admin/launch-checklist/sections/',
            {
                'title': 'core website setup',
                'description': 'Duplicate title should fail.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn('title', response.data)

    def test_delete_section_cascades_items(self):
        seed_response = self.client.get('/api/admin/launch-checklist/')
        section = seed_response.data['sections'][0]
        item_ids = [item['id'] for item in section['items']]

        response = self.client.delete(f"/api/admin/launch-checklist/sections/{section['id']}/")

        self.assertEqual(response.status_code, 204, response.content)
        self.assertFalse(ChecklistSection.objects.filter(pk=section['id']).exists())
        self.assertEqual(ChecklistItem.objects.filter(pk__in=item_ids).count(), 0)

    def test_patch_section_updates_title_and_display_order(self):
        seed_response = self.client.get('/api/admin/launch-checklist/')
        first_section = seed_response.data['sections'][0]
        last_display_order = seed_response.data['sections'][-1]['display_order']

        response = self.client.patch(
            f"/api/admin/launch-checklist/sections/{first_section['id']}/",
            {
                'title': 'Core Storefront Setup',
                'display_order': last_display_order,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data['title'], 'Core Storefront Setup')
