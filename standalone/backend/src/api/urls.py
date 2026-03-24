from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, GroupViewSet, ProductoViewSet, 
    FamiliaViewSet, SubfamiliaViewSet, ClienteViewSet,
    ProveedorViewSet, VentaViewSet, AuthorizeActionView,
    VenderRecargaView, EntradaStockViewSet,
    AjusteStockViewSet, CaducidadAlertView,
    OrdenCompraViewSet,
    PagoProveedorViewSet,
    MovimientoClienteViewSet,
    CorteCajaViewSet,
    SucursalViewSet,
    TicketSuspendidoViewSet,
    ExportarInventarioView,
    RetiroCajaViewSet,
    RetiroCajaViewSet,
    ConfiguracionViewSet,
    DescuentoViewSet,
    InventarioViewSet,
    TransferenciaViewSet
)


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'familias', FamiliaViewSet)
router.register(r'subfamilias', SubfamiliaViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'entradas', EntradaStockViewSet)
router.register(r'ajustes', AjusteStockViewSet)
router.register(r'ordenes-compra', OrdenCompraViewSet)
router.register(r'pagos-proveedores', PagoProveedorViewSet)
router.register(r'movimientos-clientes', MovimientoClienteViewSet)
router.register(r'cortes-caja', CorteCajaViewSet)
router.register(r'sucursales', SucursalViewSet)
router.register(r'tickets-suspendidos', TicketSuspendidoViewSet)
router.register(r'retiros', RetiroCajaViewSet)
router.register(r'configuracion', ConfiguracionViewSet)
router.register(r'descuentos', DescuentoViewSet)
router.register(r'inventario', InventarioViewSet)
router.register(r'transferencias', TransferenciaViewSet)


urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('authorize/', AuthorizeActionView.as_view(), name='authorize_action'),
    path('recargas/vender/', VenderRecargaView.as_view(), name='vender_recarga'),
    path('inventario/caducidades/', CaducidadAlertView.as_view(), name='caducidad_alertas'),

    path('reportes/exportar_inventario/', ExportarInventarioView.as_view(), name='exportar-inventario'),
    path('', include(router.urls)),
]