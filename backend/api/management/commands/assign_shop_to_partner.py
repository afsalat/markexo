from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from api.models import Shop

User = get_user_model()


class Command(BaseCommand):
    help = 'Assign a shop to a partner user or create a new one'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the partner user')
        parser.add_argument('--shop-id', type=int, help='ID of existing shop to assign')
        parser.add_argument('--create', action='store_true', help='Create a new shop for this partner')
        parser.add_argument('--shop-name', type=str, help='Name for the new shop (required with --create)')

    def handle(self, *args, **options):
        username = options['username']
        shop_id = options.get('shop_id')
        create_new = options.get('create')
        shop_name = options.get('shop_name')

        # Get the user
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')

        self.stdout.write(f'\nPartner: {user.username} ({user.email})\n')

        # List existing shops if no action specified
        if not shop_id and not create_new:
            self.stdout.write('\nExisting shops:')
            shops = Shop.objects.all()
            if not shops.exists():
                self.stdout.write('  No shops found. Use --create to create a new shop.')
            else:
                for shop in shops:
                    owner_info = f' (Owner: {shop.owner.username})' if shop.owner else ' (No owner)'
                    self.stdout.write(f'  ID: {shop.id} - {shop.name}{owner_info}')
            
            self.stdout.write('\nUsage:')
            self.stdout.write(f'  Assign existing shop: python manage.py assign_shop_to_partner {username} --shop-id <ID>')
            self.stdout.write(f'  Create new shop:       python manage.py assign_shop_to_partner {username} --create --shop-name "Shop Name"')
            return

        # Assign existing shop
        if shop_id:
            try:
                shop = Shop.objects.get(id=shop_id)
            except Shop.DoesNotExist:
                raise CommandError(f'Shop with ID {shop_id} does not exist')

            if shop.owner and shop.owner != user:
                self.stdout.write(self.style.WARNING(f'Shop already has owner: {shop.owner.username}'))
                confirm = input('Do you want to reassign? (yes/no): ')
                if confirm.lower() != 'yes':
                    self.stdout.write('Aborted.')
                    return

            shop.owner = user
            shop.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Shop "{shop.name}" assigned to {username}'))
            return

        # Create new shop
        if create_new:
            if not shop_name:
                raise CommandError('--shop-name is required when using --create')

            # Generate a unique email for the shop
            shop_email = f'{username.lower()}@shop.vorionmart.com'
            counter = 1
            while Shop.objects.filter(email=shop_email).exists():
                shop_email = f'{username.lower()}{counter}@shop.vorionmart.com'
                counter += 1

            shop = Shop.objects.create(
                name=shop_name,
                owner=user,
                email=shop_email,
                address='To be updated',
                city='To be updated',
                phone='0000000000',
                commission_rate=50.00,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Shop "{shop.name}" created and assigned to {username}'))
            self.stdout.write(f'  Shop ID: {shop.id}')
            self.stdout.write(f'  Email: {shop_email}')
            self.stdout.write('\n  Note: Please update shop details in Django admin or Shop Settings.')
