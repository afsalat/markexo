"""
Management command to set up Partner role with required permissions.
Run this after setting up the database: python manage.py setup_partner_role
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Creates Partner role with required permissions for shop owners'

    def handle(self, *args, **kwargs):
        self.stdout.write('Setting up Partner role...')

        # Create or get the Partner group
        partner_group, created = Group.objects.get_or_create(name='Partner')
        
        if created:
            self.stdout.write(self.style.SUCCESS('Created Partner role'))
        else:
            self.stdout.write('Partner role already exists, updating permissions...')

        # Define permissions for Partners
        # Partners should be able to manage their own products and view orders
        permission_codenames = [
            # Product permissions
            'add_product',
            'change_product', 
            'delete_product',
            'view_product',
            # Product Image permissions
            'add_productimage',
            'change_productimage',
            'delete_productimage',
            'view_productimage',
            # Shop permissions (view only for their own shop)
            'view_shop',
            # Category permissions (view only for product categorization)
            'view_category',
            # Order permissions (view orders for their products)
            'view_order',
            'view_orderitem',
        ]

        permissions_added = []
        permissions_not_found = []

        for codename in permission_codenames:
            try:
                permission = Permission.objects.get(codename=codename)
                partner_group.permissions.add(permission)
                permissions_added.append(codename)
            except Permission.DoesNotExist:
                permissions_not_found.append(codename)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Added {len(permissions_added)} permissions to Partner role:'))
        for perm in permissions_added:
            self.stdout.write(f'  ✓ {perm}')
        
        if permissions_not_found:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING(f'Permissions not found ({len(permissions_not_found)}):'))
            for perm in permissions_not_found:
                self.stdout.write(f'  ✗ {perm}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Partner role setup complete!'))
        self.stdout.write('')
        self.stdout.write('To assign a user to the Partner role, you can:')
        self.stdout.write('  1. Use Django admin at /admin/')
        self.stdout.write('  2. Or run: python manage.py assign_partner_role <username>')
