import os
import django
import sys

sys.path.append('src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.views import ProductoViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

factory = APIRequestFactory()
user = User.objects.filter(is_superuser=True).first() or User.objects.first()

request = factory.get('/api/productos/reporte-existencias/')
force_authenticate(request, user=user)

view = ProductoViewSet.as_view({'get': 'reporte_existencias'})
try:
    response = view(request)
    print("STATUS:", response.status_code)
    if hasattr(response, 'data'):
         print("DATA:", response.data)
except Exception as e:
    import traceback
    print("CRASHED:", e)
    traceback.print_exc()
