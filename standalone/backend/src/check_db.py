import os
import django
import sys

sys.path.append('src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Sucursal, PerfilUsuario
from django.contrib.auth.models import User

print("--- SUCURSALES ---")
sucursales = Sucursal.objects.all()
print(f"Total Sucursales: {sucursales.count()}")
for s in sucursales:
    print(f"ID: {s.id}, Nombre: {s.nombre}")

print("\n--- USUARIOS ---")
usuarios = User.objects.all()
for u in usuarios:
    perfil = getattr(u, 'perfil', None)
    sucursal = perfil.sucursal if perfil else None
    print(f"User: {u.username}, Role/Groups: {[g.name for g in u.groups.all()]}, Sucursal: {sucursal.nombre if sucursal else 'Sin Sucursal'}")
