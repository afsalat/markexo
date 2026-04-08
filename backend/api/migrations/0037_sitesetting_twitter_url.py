from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_banner_section'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesetting',
            name='twitter_url',
            field=models.URLField(blank=True),
        ),
    ]
