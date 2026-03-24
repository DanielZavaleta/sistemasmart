import os
import django
import sys

sys.path.append('src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Sucursal, PerfilUsuario
from django.contrib.auth.models import User
from api.serializers import UserSerializer

print("--- SERIALIZATION TEST ---")
user = User.objects.filter(username='admin').first()
if user:
    serializer = UserSerializer(user)
    print("Serialized Data:")
    print(serializer.data)
else:
    print("Admin user not found.")
