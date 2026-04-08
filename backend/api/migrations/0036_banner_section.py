from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_checklistsection_checklistitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='banner',
            name='section',
            field=models.CharField(
                choices=[
                    ('home_hero', 'Homepage Hero'),
                    ('category_hero', 'Category Page Hero'),
                    ('promo', 'Promo / Campaign'),
                    ('general', 'General'),
                ],
                default='home_hero',
                max_length=30,
            ),
        ),
    ]
