from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_product_specifications'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='shop',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='api.shop'),
        ),
    ]
