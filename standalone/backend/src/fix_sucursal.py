import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import PerfilUsuario, Sucursal

User = get_user_model()
try:
    u = User.objects.get(username='admin')
    s = Sucursal.objects.first()
    if not s:
        s = Sucursal.objects.create(nombre='Matriz', direccion='Calle Principal', telefono='12345678')
        print("Sucursal 'Matriz' creada.")
    p, created = PerfilUsuario.objects.get_or_create(usuario=u)
    p.sucursal = s
    p.save()
    print(f"Sucursal '{s.nombre}' asignada a {u.username}")
except Exception as e:
    print("Error:", str(e))
