
import os
import django
from django.db.models import Q
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VorionMart.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Shop
from api.serializers import AdminPartnerSerializer

def debug_partner_serialization():
    print("--- Debugging Partner Serialization ---")
    
    # 1. Get QuerySet
    qs = User.objects.filter(Q(groups__name='Partner') | Q(shops__isnull=False)).distinct()
    print(f"QuerySet Count: {qs.count()}")
    
    # 2. Serialize
    serializer = AdminPartnerSerializer(qs, many=True)
    data = serializer.data
    
    print("\n--- Serialized Data ---")
    print(json.dumps(data, indent=2, default=str))

if __name__ == '__main__':
    debug_partner_serialization()
