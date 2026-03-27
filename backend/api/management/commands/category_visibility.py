from django.core.management.base import BaseCommand

from api.models import Category


class Command(BaseCommand):
    help = 'Audit category visibility and optionally activate hidden categories.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--activate-all',
            action='store_true',
            help='Mark every category as active.',
        )
        parser.add_argument(
            '--slugs',
            nargs='+',
            help='Activate only the categories matching these slugs.',
        )
        parser.add_argument(
            '--quiet',
            action='store_true',
            help='Skip the category tree output and show only summary lines.',
        )

    def handle(self, *args, **options):
        activate_all = options['activate_all']
        slugs = options.get('slugs') or []
        quiet = options['quiet']

        queryset = Category.objects.select_related('parent').prefetch_related('children').order_by('parent_id', 'name')

        if activate_all:
            updated = Category.objects.filter(is_active=False).update(is_active=True)
            self.stdout.write(self.style.SUCCESS(f'Activated {updated} hidden categories.'))
        elif slugs:
            updated = Category.objects.filter(slug__in=slugs, is_active=False).update(is_active=True)
            missing = sorted(set(slugs) - set(Category.objects.filter(slug__in=slugs).values_list('slug', flat=True)))
            self.stdout.write(self.style.SUCCESS(f'Activated {updated} hidden categories by slug.'))
            if missing:
                self.stdout.write(self.style.WARNING(f'Unknown slugs: {", ".join(missing)}'))

        categories = list(queryset)
        active_count = sum(1 for category in categories if category.is_active)
        inactive_categories = [category for category in categories if not category.is_active]

        self.stdout.write(f'Total categories: {len(categories)}')
        self.stdout.write(self.style.SUCCESS(f'Active categories: {active_count}'))
        self.stdout.write(self.style.WARNING(f'Hidden categories: {len(inactive_categories)}'))

        if quiet:
            return

        children_by_parent: dict[int | None, list[Category]] = {}
        for category in categories:
            children_by_parent.setdefault(category.parent_id, []).append(category)

        def print_branch(parent_id: int | None, depth: int = 0):
            for category in children_by_parent.get(parent_id, []):
                indent = '  ' * depth
                marker = 'VISIBLE' if category.is_active else 'HIDDEN'
                self.stdout.write(f'{indent}- [{marker}] {category.name} ({category.slug})')
                print_branch(category.id, depth + 1)

        print_branch(None)
