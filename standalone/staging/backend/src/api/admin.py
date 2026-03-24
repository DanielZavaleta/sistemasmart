from django.contrib import admin
from .models import (
    Familia, Subfamilia, Producto, Cliente, Proveedor,
    Venta, VentaItem, VentaPago
)


@admin.register(Familia)
class FamiliaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Subfamilia)
class SubfamiliaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'familia')
    list_filter = ('familia',)
    search_fields = ('nombre',)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('descripcion', 'codigo_barras', 'subfamilia', 'costo', 'precio_1', 'stock_actual')
    list_filter = ('subfamilia__familia', 'subfamilia')
    search_fields = ('descripcion', 'codigo_barras')
    autocomplete_fields = ['subfamilia']

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('razon_social', 'rfc', 'nombre_comercial', 'email', 'telefono')
    search_fields = ('razon_social', 'rfc', 'nombre_comercial')

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('razon_social', 'rfc', 'nombre_comercial', 'email', 'telefono')
    search_fields = ('razon_social', 'rfc', 'nombre_comercial')


# --- Administración de Ventas (Modo Inspección) ---
# por seguridad solo se pueden ver y no modificar

class VentaItemInline(admin.TabularInline):
    model = VentaItem
    extra = 0 # No mostrar formularios vacíos
    readonly_fields = ('producto', 'cantidad', 'precio_unitario', 'subtotal')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False # No permitir añadir items desde el admin

class VentaPagoInline(admin.TabularInline):
    model = VentaPago
    extra = 0
    readonly_fields = ('metodo', 'monto')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cajero', 'total', 'creado_en', 'cliente')
    list_filter = ('creado_en', 'cajero')
    search_fields = ('id', 'cliente__rfc', 'cajero__username')
    inlines = [VentaItemInline, VentaPagoInline]
    
    # --- IMPORTANTE: Prevenir cambios manuales ---
    # Hacemos que el admin de Ventas sea de SOLO LECTURA.
    # Las ventas solo deben crearse desde el POS (API)
    # para asegurar que el stock se descuente.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False # Permitir ver, pero no cambiar

    def has_delete_permission(self, request, obj=None):
        return False