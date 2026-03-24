from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from api.models import Sucursal, Producto, Inventario, PerfilUsuario, Venta, EntradaStock, Cliente, MovimientoCliente, ProductoComponente
from api.serializers import UserSerializer, EntradaStockSerializer, AjusteStockSerializer
from api.views import VentaViewSet
import decimal

class UserSerializerTests(TestCase):
    def setUp(self):
        self.sucursal = Sucursal.objects.create(nombre="Tecate")
        self.user = User.objects.create_user(username='testuser', password='password')
        self.perfil = PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)

    def test_user_serialization_with_sucursal(self):
        """Verify that a user serializes with their correctly linked sucursal."""
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['sucursal'], 'Tecate')

    def test_user_serialization_without_sucursal(self):
        """Verify that a user without a sucursal serializes with 'Sin Sucursal'."""
        self.perfil.sucursal = None
        self.perfil.save()
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['sucursal'], 'Sin Sucursal')

    def test_user_serialization_is_superuser(self):
        """Verify that a user serializes with their correctly linked is_superuser."""
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['is_superuser'], False)

    def test_user_serialization_sucursal_id(self):
        """Verify that a user serializes with their correctly linked sucursal_id."""
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['sucursal_id'], self.sucursal.id)


class VentaDeductionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.sucursal = Sucursal.objects.create(nombre="Matriz")
        self.user = User.objects.create_superuser(username='cajero', password='password')
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        
        self.prod = Producto.objects.create(
            codigo_barras='PROD-100', descripcion='Arroz 1kg', costo=10.00, stock_actual=100.00, precio_1=15.00
        )
        self.inv, _ = Inventario.objects.get_or_create(sucursal=self.sucursal, producto=self.prod, defaults={'cantidad': 50.00})

    def test_registrar_venta_deducts_from_inventario(self):
        request = self.factory.post('/api/ventas/registrar/', {
            'items': [{'id': self.prod.id, 'cantidad': 10.00, 'precio_unitario': 15.00}],
            'pagos': [{'metodo': 'efectivo', 'monto': 150.00}],
            'total': 150.00
        }, format='json')
        force_authenticate(request, user=self.user)
        response = VentaViewSet.as_view({'post': 'registrar_venta'})(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.inv.refresh_from_db()
        self.assertEqual(float(self.inv.cantidad), 40.00)


class EntradaStockTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(username='admin', password='password')
        self.sucursal = Sucursal.objects.create(nombre="Branch B")
        self.perfil = PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        self.prod = Producto.objects.create(codigo_barras='PROD-200', descripcion='Frijol 1kg', stock_actual=0.0)

    def test_entrada_stock_updates_inventario(self):
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/')
        request.user = self.user
        data = {
            'tipo': 'COMPRA',
            'items': [{'producto_id': self.prod.id, 'cantidad': 25.00, 'costo_unitario': 12.00, 'tasa_iva': 0.0, 'tasa_ieps': 0.0, 'precio_venta_sugerido': 15.0}]
        }
        serializer = EntradaStockSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        inv = Inventario.objects.get(sucursal=self.sucursal, producto=self.prod)
        self.assertEqual(float(inv.cantidad), 25.00)


class AjusteStockTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser(username='admin2', password='password')
        self.sucursal = Sucursal.objects.create(nombre="Branch C")
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        self.prod = Producto.objects.create(codigo_barras='PROD-300', descripcion='Lentes', stock_actual=10.0)

    def test_ajuste_stock_updates_inventario(self):
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/')
        request.user = self.user
        inv, _ = Inventario.objects.get_or_create(sucursal=self.sucursal, producto=self.prod, defaults={'cantidad': 8.00})
        data = {'producto_id': self.prod.id, 'cantidad_nueva': 15.00, 'notas': 'Ajuste'}
        serializer = AjusteStockSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        inv.refresh_from_db()
        self.assertEqual(float(inv.cantidad), 15.00)


class ClienteCreditTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.sucursal = Sucursal.objects.create(nombre="Main")
        self.user = User.objects.create_superuser(username='cajero2', password='password')
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        self.cliente = Cliente.objects.create(rfc='XAXX010101000', razon_social='Cliente Prueba', credito_disponible=500.00, limite_credito=1000.00)
        self.prod = Producto.objects.create(codigo_barras='P500', descripcion='TV', costo=300.0, stock_actual=10.0, precio_1=350.0)
        Inventario.objects.create(sucursal=self.sucursal, producto=self.prod, cantidad=10.0)

    def test_venta_credito_success_updates_disponible(self):
        request = self.factory.post('/api/ventas/registrar/', {
            'items': [{'id': self.prod.id, 'cantidad': 1.00, 'precio_unitario': 200.00}],
            'pagos': [{'metodo': 'credito', 'monto': 200.00}],
            'total': 200.00,
            'cliente_id': self.cliente.id
        }, format='json')
        force_authenticate(request, user=self.user)
        response = VentaViewSet.as_view({'post': 'registrar_venta'})(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Failed: {response.data if hasattr(response, 'data') else 'No data'}")
        self.cliente.refresh_from_db()
        self.assertEqual(float(self.cliente.credito_disponible), 300.00)

    def test_venta_credito_fails_exceeding_disponible(self):
        request = self.factory.post('/api/ventas/registrar/', {
            'items': [{'id': self.prod.id, 'cantidad': 1.00, 'precio_unitario': 600.00}],
            'pagos': [{'metodo': 'credito', 'monto': 600.00}],
            'total': 600.00,
            'cliente_id': self.cliente.id
        }, format='json')
        force_authenticate(request, user=self.user)
        response = VentaViewSet.as_view({'post': 'registrar_venta'})(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PaqueteVentaTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.sucursal = Sucursal.objects.create(nombre="Matriz2")
        self.user = User.objects.create_superuser(username='cajero3', password='password')
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        self.comp1 = Producto.objects.create(codigo_barras='C1', descripcion='Coca', stock_actual=20.0)
        Inventario.objects.create(sucursal=self.sucursal, producto=self.comp1, cantidad=20.0)
        self.comp2 = Producto.objects.create(codigo_barras='C2', descripcion='Papas', stock_actual=15.0)
        Inventario.objects.create(sucursal=self.sucursal, producto=self.comp2, cantidad=15.0)
        self.paquete = Producto.objects.create(codigo_barras='P1', descripcion='Combo', es_paquete=True, stock_actual=0.0)
        ProductoComponente.objects.create(paquete=self.paquete, componente=self.comp1, cantidad=2.0)
        ProductoComponente.objects.create(paquete=self.paquete, componente=self.comp2, cantidad=1.0)

    def test_venta_paquete_deducts_components(self):
        request = self.factory.post('/api/ventas/registrar/', {
            'items': [{'id': self.paquete.id, 'cantidad': 2.00, 'precio_unitario': 50.00}],
            'pagos': [{'metodo': 'efectivo', 'monto': 100.00}],
            'total': 100.00
        }, format='json')
        force_authenticate(request, user=self.user)
        response = VentaViewSet.as_view({'post': 'registrar_venta'})(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        inv_c1 = Inventario.objects.get(sucursal=self.sucursal, producto=self.comp1)
        inv_c2 = Inventario.objects.get(sucursal=self.sucursal, producto=self.comp2)
        self.assertEqual(float(inv_c1.cantidad), 16.00)
        self.assertEqual(float(inv_c2.cantidad), 13.00)


from rest_framework.test import APITestCase
from django.contrib.auth.models import Permission

class AtomicPermissionTests(APITestCase):
    def setUp(self):
        self.sucursal = Sucursal.objects.create(nombre="Main Matrix")
        self.user_no_perms = User.objects.create_user(username='regular', password='password')
        PerfilUsuario.objects.create(usuario=self.user_no_perms, sucursal=self.sucursal)
        
        self.user_with_perms = User.objects.create_user(username='permitted', password='password')
        PerfilUsuario.objects.create(usuario=self.user_with_perms, sucursal=self.sucursal)
        # Django automatically generates permissions for model 'producto' on app 'api'
        view_perm = Permission.objects.get(codename='view_producto')
        self.user_with_perms.user_permissions.add(view_perm)
        
        self.super_user = User.objects.create_superuser(username='superuser', password='password')
        PerfilUsuario.objects.create(usuario=self.super_user, sucursal=self.sucursal)
        
        # Create a product for listing endpoint
        Producto.objects.create(codigo_barras='P_TEST', descripcion='Test Product', costo=10, precio_1=20)

    def test_view_productos_permission_denied(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get('/api/productos/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_view_productos_permission_granted(self):
        self.client.force_authenticate(user=self.user_with_perms)
        response = self.client.get('/api/productos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_view_productos_superuser_always_allowed(self):
        self.client.force_authenticate(user=self.super_user)
        response = self.client.get('/api/productos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


from django.utils import timezone

class TransferenciaTests(APITestCase):
    def setUp(self):
        self.sucursal_a = Sucursal.objects.create(nombre="Sucursal A")
        self.sucursal_b = Sucursal.objects.create(nombre="Sucursal B")
        self.user_a = User.objects.create_superuser(username='user_a', password='password')
        PerfilUsuario.objects.create(usuario=self.user_a, sucursal=self.sucursal_a)
        
        self.prod = Producto.objects.create(codigo_barras='P_TRANSFER', descripcion='Test Product', costo=10, precio_1=20)
        self.inv_a = Inventario.objects.create(sucursal=self.sucursal_a, producto=self.prod, cantidad=10.0)
        self.inv_b = Inventario.objects.create(sucursal=self.sucursal_b, producto=self.prod, cantidad=2.0)

    def test_transferir_product_updates_both_inventories(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/transferencias/', {
            'sucursal_origen': self.sucursal_a.id,
            'sucursal_destino': self.sucursal_b.id,
            'items': [{'producto': self.prod.id, 'cantidad': 4.0}]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Failed: {response.data if hasattr(response, 'data') else 'No data'}")
        self.inv_a.refresh_from_db()
        self.inv_b.refresh_from_db()
        self.assertEqual(float(self.inv_a.cantidad), 6.0)
        self.assertEqual(float(self.inv_b.cantidad), 6.0)


class CorteCajaTests(APITestCase):
    def setUp(self):
        self.sucursal = Sucursal.objects.create(nombre="Sucursal Corte")
        self.user = User.objects.create_superuser(username='user_corte', password='password')
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        
        self.prod = Producto.objects.create(codigo_barras='P_CORTE', descripcion='Corte Item', costo=10, precio_1=20)
        Inventario.objects.create(sucursal=self.sucursal, producto=self.prod, cantidad=50.0)

    def test_calcular_totales_sums_sales(self):
        self.client.force_authenticate(user=self.user)
        # Register sale
        self.client.post('/api/ventas/registrar/', {
            'items': [{'id': self.prod.id, 'cantidad': 2.0, 'precio_unitario': 20.0}],
            'pagos': [{'metodo': 'efectivo', 'monto': 40.0}],
            'total': 40.0
        }, format='json')
        
        # Calculate totals
        response = self.client.get('/api/cortes-caja/calcular-totales/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify sums
        self.assertEqual(float(response.data['ventas_efectivo']), 40.0)


class AbonoClienteTests(APITestCase):
    def setUp(self):
        self.sucursal = Sucursal.objects.create(nombre="Main")
        self.user = User.objects.create_superuser(username='user_abono', password='password')
        PerfilUsuario.objects.create(usuario=self.user, sucursal=self.sucursal)
        self.cliente = Cliente.objects.create(rfc='XAXX010101000', razon_social='Cliente Prueba', credito_disponible=300.00, limite_credito=1000.00)

    def test_abono_increases_disponible(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/movimientos-clientes/', {
            'cliente_id': self.cliente.id,
            'tipo': 'abono',
            'monto': 200.00,
            'metodo_pago': 'efectivo',
            'descripcion': 'Abono de prueba'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Failed: {response.data if hasattr(response, 'data') else 'No data'}")
        self.cliente.refresh_from_db()
        self.assertEqual(float(self.cliente.credito_disponible), 500.00)
