from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_alter_product_shop'),
    ]

    operations = [
        migrations.AddField(
            model_name='supplier',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='supplier',
            name='city',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='supplier',
            name='contact_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='supplier',
            name='contact_person',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='supplier',
            name='contact_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='supplier',
            name='instagram_handle',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='supplier',
            name='notes',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='supplier',
            name='source_platform',
            field=models.CharField(blank=True, help_text='e.g. Meesho, IndiaMART, Instagram, Shopify', max_length=100),
        ),
        migrations.AddField(
            model_name='supplier',
            name='store_url',
            field=models.URLField(blank=True, help_text='Direct store, catalog, or profile URL'),
        ),
        migrations.AddField(
            model_name='supplier',
            name='supplier_type',
            field=models.CharField(choices=[('local_shop', 'Local Shop'), ('ecommerce', 'E-commerce Website'), ('social', 'Online Social Supplier'), ('marketplace', 'Marketplace Seller'), ('wholesale', 'Wholesale Supplier'), ('manufacturer', 'Manufacturer'), ('other', 'Other')], default='other', max_length=20),
        ),
        migrations.AddField(
            model_name='supplier',
            name='website_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='supplier',
            name='whatsapp_number',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AlterField(
            model_name='supplier',
            name='api_endpoint',
            field=models.URLField(blank=True),
        ),
        migrations.AlterField(
            model_name='supplier',
            name='api_key',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
