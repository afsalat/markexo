"""
Management command to assign Partner role to a user.
Run: python manage.py assign_partner_role <username>
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Assigns Partner role to a specified user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to assign Partner role to')

    def handle(self, *args, **kwargs):
        username = kwargs['username']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')

        try:
            partner_group = Group.objects.get(name='Partner')
        except Group.DoesNotExist:
            raise CommandError('Partner role does not exist. Run "python manage.py setup_partner_role" first.')

        # Ensure user is staff (required for admin API access)
        if not user.is_staff:
            user.is_staff = True
            user.save()
            self.stdout.write(f'Set is_staff=True for user "{username}"')

        # Add user to Partner group
        user.groups.add(partner_group)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully assigned Partner role to user "{username}"'))
        
        # Show user's current permissions
        all_perms = set()
        for group in user.groups.all():
            for perm in group.permissions.all():
                all_perms.add(perm.codename)
        
        self.stdout.write('')
        self.stdout.write(f'User "{username}" now has {len(all_perms)} permissions:')
        for perm in sorted(all_perms):
            self.stdout.write(f'  • {perm}')
