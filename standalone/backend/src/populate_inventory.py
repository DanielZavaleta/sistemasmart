
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Producto, Sucursal, Inventario, PerfilUsuario
from django.contrib.auth.models import User

def populate_inventory():
    print("Iniciando migración de inventario...")
    
    # 1. Ensure at least one Branch exists
    sucursal_default, created = Sucursal.objects.get_or_create(
        nombre="Matriz",
        defaults={'direccion': 'Direccion Principal'}
    )
    if created:
        print(f"Creada Sucursal por defecto: {sucursal_default.nombre}")
    else:
        print(f"Usando Sucursal existente: {sucursal_default.nombre}")

    # 2. Iterate products and create Inventory
    productos = Producto.objects.all()
    count = 0
    for prod in productos:
        # Check if inventory already exists
        inv, created_inv = Inventario.objects.get_or_create(
            sucursal=sucursal_default,
            producto=prod,
            defaults={'cantidad': prod.stock_actual}
        )
        if created_inv:
            count += 1
            # print(f"Inventario creado para {prod.descripcion}: {prod.stock_actual}")
        else:
            # Update if exists (optional, or skip)
            # inv.cantidad = prod.stock_actual
            # inv.save()
            pass
    
    print(f"Migrados {count} productos al inventario de {sucursal_default.nombre}.")

    # 3. Assign Users to this Branch if they don't have a profile
    users = User.objects.all()
    for user in users:
        if not hasattr(user, 'perfil'):
            PerfilUsuario.objects.create(usuario=user, sucursal=sucursal_default)
            print(f"Asignado usuario {user.username} a {sucursal_default.nombre}")

if __name__ == '__main__':
    populate_inventory()
