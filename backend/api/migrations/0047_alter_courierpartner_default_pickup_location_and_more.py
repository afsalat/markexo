# Generated for VorionMart HQ legal invoicing and return origin defaults

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0046_sitesetting_logo_dark_sitesetting_logo_light'),
    ]

    operations = [
        migrations.AlterField(
            model_name='courierpartner',
            name='default_pickup_location',
            field=models.CharField(default='HQ Dispatch', help_text='Pickup location nickname registered on courier portal', max_length=100),
        ),
        migrations.AlterField(
            model_name='courierpartner',
            name='pickup_pincode',
            field=models.CharField(default='673011', help_text='Origin fallback pincode', max_length=10),
        ),
        migrations.AlterField(
            model_name='shipment',
            name='pickup_location',
            field=models.CharField(default='HQ Dispatch', max_length=150),
        ),
        migrations.AlterField(
            model_name='shipment',
            name='pickup_pincode',
            field=models.CharField(default='673011', max_length=10),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_warehouse_name',
            field=models.CharField(blank=True, default='VorionMart HQ', max_length=150),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_phone',
            field=models.CharField(blank=True, default='+91 8086216468', max_length=20),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_address',
            field=models.TextField(blank=True, default='Vorion Nexus Technology, English Church, West Nadakkavu'),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_city',
            field=models.CharField(blank=True, default='Kozhikode', max_length=100),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_state',
            field=models.CharField(blank=True, default='Kerala', max_length=100),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_pincode',
            field=models.CharField(blank=True, default='673011', max_length=10),
        ),
        migrations.AlterField(
            model_name='sitesetting',
            name='pickup_gstin',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]
