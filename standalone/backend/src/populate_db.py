
import os
import django
import random
import decimal
from datetime import timedelta
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from api.models import (
    Familia, Subfamilia, Producto, Cliente, Proveedor, Sucursal, 
    EntradaStock, EntradaStockItem, Descuento, Venta, VentaItem, VentaPago
)

def create_users():
    print("Creating Users...")
    # Admin
    admin, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@example.com'})
    if created:
        admin.set_password('admin123')
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        print(" - Superuser 'admin' created (pass: admin123)")
    else:
        print(" - User 'admin' already exists")

    # Cajero
    cajero, created = User.objects.get_or_create(username='cajero', defaults={'email': 'cajero@example.com'})
    if created:
        cajero.set_password('cajero123')
        cajero.save()
        print(" - User 'cajero' created (pass: cajero123)")
    else:
        print(" - User 'cajero' already exists")
    
    return admin, cajero

def create_catalogos():
    print("Creating Catalogos (Discount, Families)...")
    
    # Descuentos
    desc_5, _ = Descuento.objects.get_or_create(porcentaje=5.00, defaults={'descripcion': 'Cliente Frecuente'})
    desc_10, _ = Descuento.objects.get_or_create(porcentaje=10.00, defaults={'descripcion': 'VIP'})
    desc_15, _ = Descuento.objects.get_or_create(porcentaje=15.00, defaults={'descripcion': 'Empleado'})

    # Familias
    bebidas, _ = Familia.objects.get_or_create(nombre='Bebidas')
    abarrotes, _ = Familia.objects.get_or_create(nombre='Abarrotes')
    limpieza, _ = Familia.objects.get_or_create(nombre='Limpieza')

    # Subfamilias
    refrescos, _ = Subfamilia.objects.get_or_create(familia=bebidas, nombre='Refrescos')
    jugos, _ = Subfamilia.objects.get_or_create(familia=bebidas, nombre='Jugos')
    enlatados, _ = Subfamilia.objects.get_or_create(familia=abarrotes, nombre='Enlatados')
    granos, _ = Subfamilia.objects.get_or_create(familia=abarrotes, nombre='Granos y Semillas')
    detergentes, _ = Subfamilia.objects.get_or_create(familia=limpieza, nombre='Detergentes')

    return locals()

def create_proveedores():
    print("Creating Proveedores...")
    prov1, _ = Proveedor.objects.get_or_create(rfc='XAXX010101000', defaults={
        'razon_social': 'Distribuidora de Bebidas S.A.', 'nombre_comercial': 'Coca-Cola Dist', 'telefono': '5551234567'})
    prov2, _ = Proveedor.objects.get_or_create(rfc='XBXX010101000', defaults={
        'razon_social': 'Abarrotes del Centro S.A.', 'nombre_comercial': 'El Mayorista', 'telefono': '5559876543'})
    return prov1, prov2

def create_productos(cats):
    print("Creating Productos...")
    products = []
    
    # Refresco (Tiene descuento)
    p1, _ = Producto.objects.get_or_create(codigo_barras='75001', defaults={
        'descripcion': 'Coca Cola 600ml',
        'costo': 12.00,
        'stock_actual': 0, # Se llena con entradas
        'subfamilia': cats['refrescos'],
        'precio_1': 18.00,
        'permite_descuento': True,
        'tasa_iva': 0.16
    })
    products.append(p1)

    # Atún (Sin descuento)
    p2, _ = Producto.objects.get_or_create(codigo_barras='75002', defaults={
        'descripcion': 'Atún Dolores Agua',
        'costo': 15.00,
        'stock_actual': 0,
        'subfamilia': cats['enlatados'],
        'precio_1': 22.00,
        'permite_descuento': False, # No aplica descuento
        'tasa_iva': 0.00
    })
    products.append(p2)

    # Arroz Granel (Granel)
    p3, _ = Producto.objects.get_or_create(codigo_barras='GRANEL01', defaults={
        'descripcion': 'Arroz Morelos (Kg)',
        'costo': 20.00,
        'stock_actual': 0,
        'subfamilia': cats['granos'],
        'precio_1': 35.00,
        'tipo_venta': 'GRANEL',
        'permite_descuento': True
    })
    products.append(p3)

    return products

def create_clientes(discounts):
    print("Creating Clientes...")
    
    # Cliente Normal
    c1, _ = Cliente.objects.get_or_create(rfc='XAXX010101001', defaults={
        'razon_social': 'Juan Pérez Generico',
        'email': 'juan@mail.com',
        'descuento': None
    })

    # Cliente VIP (10%)
    c2, _ = Cliente.objects.get_or_create(rfc='XAXX010101002', defaults={
        'razon_social': 'María VIP',
        'email': 'maria@mail.com',
        'descuento': discounts['desc_10']
    })

    return c1, c2

def add_stock(admin, provs, prods):
    print("Adding Stock (Entradas)...")
    
    # Entrada 1
    entrada, created = EntradaStock.objects.get_or_create(factura='FACT-001', defaults={
        'proveedor': provs[0],
        'usuario': admin,
        'tipo': 'COMPRA',
        'notas': 'Inventario Inicial Bebidas'
    })
    
    if created:
        # Coca Cola
        qty = 100
        cost = prods[0].costo
        EntradaStockItem.objects.create(entrada=entrada, producto=prods[0], cantidad=qty, costo_unitario=cost)
        prods[0].stock_actual += qty
        prods[0].save()
        
        entrada.total_costo = qty * cost
        entrada.save()
        print(" - Added 100 Coca Colas")

    # Entrada 2
    entrada2, created2 = EntradaStock.objects.get_or_create(factura='FACT-002', defaults={
        'proveedor': provs[1],
        'usuario': admin,
        'tipo': 'COMPRA'
    })

    if created2:
        # Atun
        qty1 = 50
        cost1 = prods[1].costo
        EntradaStockItem.objects.create(entrada=entrada2, producto=prods[1], cantidad=qty1, costo_unitario=cost1)
        prods[1].stock_actual += qty1
        prods[1].save()

        # Arroz
        qty2 = 200 # kg
        cost2 = prods[2].costo
        EntradaStockItem.objects.create(entrada=entrada2, producto=prods[2], cantidad=qty2, costo_unitario=cost2)
        prods[2].stock_actual += qty2
        prods[2].save()
        
        entrada2.total_costo = (qty1 * cost1) + (qty2 * cost2)
        entrada2.save()
        print(" - Added Atun and Arroz")

if __name__ == '__main__':
    try:
        users = create_users() # (admin, cajero)
        cats = create_catalogos() # dict of objs
        provs = create_proveedores() # (prov1, prov2)
        prods = create_productos(cats) # [p1, p2, p3]
        
        # Extract discounts from cats dict
        discounts = {k:v for k,v in cats.items() if k.startswith('desc_')}
        
        clients = create_clientes(discounts)
        
        add_stock(users[0], provs, prods)
        
        print("\nSUCCESS: Database populated with test data!")
        print("------------------------------------------------")
        print("Users: admin / admin123, cajero / cajero123")
        print("Products: Coca Cola (75001), Atún (75002), Arroz (Granel)")
        print("Clients: María VIP (Has 10% discount)")
        print("Discounts: 5%, 10%, 15%")
        
    except Exception as e:
        print(f"ERROR: {e}")
