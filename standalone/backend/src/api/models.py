from django.db import models
from django.contrib.auth.models import User 

# ... (Previous Code)

class Familia(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre

class Subfamilia(models.Model):
    familia = models.ForeignKey(Familia, related_name='subfamilias', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    class Meta:
        unique_together = ('familia', 'nombre')
    def __str__(self):
        return f"{self.familia.nombre} > {self.nombre}"


class Producto(models.Model):
    # ... (Product Code)
    codigo_barras = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255)
    costo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    subfamilia = models.ForeignKey(Subfamilia, related_name='productos', on_delete=models.SET_NULL, null=True, blank=True)
    requiere_caducidad = models.BooleanField(default=False)
    
    TIPO_VENTA_CHOICES = [
        ('UNIDAD', 'Por Unidad/Pieza'),
        ('GRANEL', 'A Granel (Kg/Lt)'),
        ('CAJA', 'Por Caja/Paquete'),
    ]
    tipo_venta = models.CharField(max_length=10, choices=TIPO_VENTA_CHOICES, default='UNIDAD')
    tasa_iva = models.DecimalField(max_digits=5, decimal_places=2, default=0.16) 
    tasa_ieps = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    porcentaje_utilidad = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) 
    permite_descuento = models.BooleanField(default=True)
    fecha_caducidad = models.DateField(null=True, blank=True)

    # Configuración de Ganancia (Especialmente para Paquetes)
    TIPO_GANANCIA_CHOICES = [('porcentaje', 'Porcentaje (%)'), ('fijo', 'Monto Fijo ($)')]
    tipo_ganancia = models.CharField(max_length=15, choices=TIPO_GANANCIA_CHOICES, default='porcentaje')
    ganancia_fija = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Monto fijo de ganancia si aplica")

    # Campos SAT / Facturacion 
    clave_sat_unidad = models.CharField(max_length=20, blank=True, null=True, default='H87') 
    clave_sat_producto = models.CharField(max_length=20, blank=True, null=True, default='01010101') 
    numero_identificacion = models.CharField(max_length=50, blank=True, null=True)
    objeto_impuesto = models.CharField(max_length=20, blank=True, null=True, default='02') 

    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)

    precio_1 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_2 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_3 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_4 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_5 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    precio_6 = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    es_paquete = models.BooleanField(default=False, help_text="Indica si este producto es un paquete/kit compuesto de otros productos")

    def __str__(self):
        return f"{self.codigo_barras} - {self.descripcion}"

    def save(self, *args, **kwargs):
        costo = self.costo or 0.0
        utilidad = self.porcentaje_utilidad or 0.0
        iva = self.tasa_iva or 0.16
        ieps = self.tasa_ieps or 0.0
        try:
           costo_val = float(costo)
           utilidad_val = float(utilidad) / 100.0
           iva_val = float(iva)
           ieps_val = float(ieps)
           if costo_val >= 0:
               base_ieps = costo_val * (1.0 + ieps_val)
               con_utilidad = base_ieps * (1.0 + utilidad_val)
               precio_final = con_utilidad * (1.0 + iva_val)
               self.precio_1 = round(precio_final, 2)
        except (ValueError, TypeError):
             pass
        super(Producto, self).save(*args, **kwargs)


class ProductoComponente(models.Model):
    paquete = models.ForeignKey(Producto, related_name='componentes', on_delete=models.CASCADE)
    componente = models.ForeignKey(Producto, related_name='paquetes_donde_aparece', on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cantidad de este componente incluida en el paquete")
    class Meta:
        unique_together = ('paquete', 'componente')
    def __str__(self):
        return f"{self.paquete.descripcion} contiene {self.cantidad} de {self.componente.descripcion}"


class Descuento(models.Model):
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2, help_text="Porcentaje de descuento (0-100)")
    descripcion = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.porcentaje}% - {self.descripcion or ''}"


class Cliente(models.Model):

    rfc = models.CharField(max_length=13, unique=True, db_index=True)
    razon_social = models.CharField(max_length=255)
    nombre_comercial = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    cp = models.CharField(max_length=10, blank=True, null=True)
    credito_disponible = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    dias_credito = models.IntegerField(default=0)
    descuento = models.ForeignKey(Descuento, on_delete=models.SET_NULL, null=True, blank=True, related_name='clientes')
    
    # Nuevos campos SAT

    regimen_fiscal = models.CharField(max_length=10, blank=True, null=True, help_text="Clave del régimen fiscal (ej. 601)")
    uso_cfdi = models.CharField(max_length=10, blank=True, null=True, help_text="Uso del CFDI (ej. G03)")
    cp_fiscal = models.CharField(max_length=10, blank=True, null=True, help_text="Código Postal Fiscal")

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.razon_social


class MovimientoCliente(models.Model):
    TIPO_CHOICES = [('cargo', 'Cargo'), ('abono', 'Abono')]
    cliente = models.ForeignKey(Cliente, related_name='movimientos', on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True, null=True)
    def __str__(self):
        return f"{self.tipo.upper()} - {self.cliente.razon_social} - ${self.monto}"


class Proveedor(models.Model):
    rfc = models.CharField(max_length=13, unique=True, db_index=True)
    razon_social = models.CharField(max_length=255)
    nombre_comercial = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.nombre_comercial or self.razon_social

class Venta(models.Model):
    cajero = models.ForeignKey(User, related_name='ventas', on_delete=models.SET_NULL, null=True)
    cliente = models.ForeignKey(Cliente, related_name='compras', on_delete=models.SET_NULL, null=True, blank=True)
    sucursal = models.ForeignKey('Sucursal', related_name='ventas', on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    creado_en = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Venta {self.id} - ${self.total}"

class VentaItem(models.Model):
    venta = models.ForeignKey(Venta, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, related_name='items_vendidos', on_delete=models.SET_NULL, null=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    def __str__(self):
        return f"{self.producto.descripcion} x{self.cantidad}"

class VentaPago(models.Model):
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('credito', 'Crédito'),
        ('vales', 'Vales'),
        ('dolares', 'Dólares'),
        ('transferencia', 'Transferencia'),
    ]
    venta = models.ForeignKey(Venta, related_name='pagos', on_delete=models.CASCADE)
    metodo = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo_cambio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    referencia = models.CharField(max_length=100, blank=True, null=True)
    def __str__(self):
        return f"Pago {self.metodo} - ${self.monto}"

class RetiroCaja(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sucursal = models.ForeignKey('Sucursal', related_name='retiros', on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Retiro ${self.monto}: {self.motivo}"

class TicketSuspendido(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True)
    items_json = models.JSONField(help_text="Lista de productos y cantidades en formato JSON")
    creado_en = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Ticket Suspendido {self.id} - {self.creado_en}"


class Sucursal(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return self.nombre


class EntradaStock(models.Model):
    TIPO_CHOICES = [
        ('COMPRA', 'Compra'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='COMPRA')
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True, blank=True)
    sucursal = models.ForeignKey('Sucursal', related_name='entradas', on_delete=models.SET_NULL, null=True, blank=True)
    sucursal_origen = models.ForeignKey(Sucursal, related_name='salidas_transferencia', on_delete=models.SET_NULL, null=True, blank=True)
    factura = models.CharField(max_length=100, blank=True, null=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True, null=True)
    total_costo = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"{self.get_tipo_display()} {self.id} - {self.proveedor.nombre_comercial if self.proveedor else 'N/A'}"
    

class EntradaStockItem(models.Model):
    entrada = models.ForeignKey(EntradaStock, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_disponible = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    tasa_iva = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tasa_ieps = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    precio_venta_sugerido = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fecha_caducidad = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.producto.descripcion} (x{self.cantidad})"


class AjusteStock(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    sucursal = models.ForeignKey('Sucursal', related_name='ajustes', on_delete=models.SET_NULL, null=True, blank=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    cantidad_anterior = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_nueva = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2)
    notas = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        return f"Ajuste {self.producto.descripcion}: {self.diferencia}"


class OrdenCompra(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('recibida', 'Recibida'),
        ('cancelada', 'Cancelada'),
    ]
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) 
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega_esperada = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"OC-{self.id} a {self.proveedor.nombre_comercial}"


class OrdenCompraItem(models.Model):
    orden_compra = models.ForeignKey(OrdenCompra, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.producto.descripcion} (x{self.cantidad})"


class PagoProveedor(models.Model):
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque', 'Cheque'),
        ('otro', 'Otro'),
    ]
    proveedor = models.ForeignKey(Proveedor, related_name='pagos', on_delete=models.CASCADE)
    orden_compra = models.ForeignKey(OrdenCompra, related_name='pagos', on_delete=models.SET_NULL, null=True, blank=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='efectivo')
    referencia = models.CharField(max_length=100, blank=True, null=True)
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Pago a {self.proveedor.nombre_comercial} - ${self.monto}"


class CorteCaja(models.Model):
    TIPO_CHOICES = [
        ('CORTE', 'Corte de Caja'),
        ('ARQUEO', 'Arqueo de Caja'),
    ]
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sucursal = models.ForeignKey('Sucursal', related_name='cortes', on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='CORTE')
    total_ventas = models.DecimalField(max_digits=10, decimal_places=2)
    total_efectivo_sistema = models.DecimalField(max_digits=10, decimal_places=2)
    total_tarjeta_sistema = models.DecimalField(max_digits=10, decimal_places=2)
    total_credito_sistema = models.DecimalField(max_digits=10, decimal_places=2)
    dinero_en_caja = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2)
    detalles = models.JSONField(default=dict, blank=True)
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_tipo_display()} {self.id} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"

class Configuracion(models.Model):
    nombre_tienda = models.CharField(max_length=255, default="Mi Tienda")
    direccion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    rfc = models.CharField(max_length=20, blank=True, null=True)
    mensaje_ticket = models.TextField(blank=True, null=True, default="¡Gracias por su compra!")
    
    # Nuevos campos para personalización del ticket
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    encabezado_personalizado = models.TextField(blank=True, null=True, help_text="Texto opcional para reemplazar o añadir al encabezado estándar")
    ticket_font_size = models.IntegerField(default=12, help_text="Tamaño de fuente para la impresión (px)")
    mostrar_logo = models.BooleanField(default=True)
    mostrar_encabezado = models.BooleanField(default=True)
    mostrar_pie = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nombre_tienda

    def save(self, *args, **kwargs):
        # Singleton: ensure only one instance
        if not self.pk and Configuracion.objects.exists():
            return
        super(Configuracion, self).save(*args, **kwargs)


class PerfilUsuario(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.SET_NULL, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, help_text="Imagen de perfil del usuario")

    def __str__(self):
        return f"Perfil de {self.usuario.username}"


class Inventario(models.Model):
    sucursal = models.ForeignKey(Sucursal, related_name='inventario', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, related_name='inventario', on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    ubicacion = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        unique_together = ('sucursal', 'producto')
    
    def __str__(self):
         return f"{self.producto.descripcion} en {self.sucursal.nombre}: {self.cantidad}"


class Transferencia(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    sucursal_origen = models.ForeignKey(Sucursal, related_name='transferencias_salida', on_delete=models.CASCADE)
    sucursal_destino = models.ForeignKey(Sucursal, related_name='transferencias_entrada', on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_completada = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Transf #{self.id}: {self.sucursal_origen} -> {self.sucursal_destino}"


class TransferenciaItem(models.Model):
    transferencia = models.ForeignKey(Transferencia, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
         return f"{self.producto.descripcion} x{self.cantidad}"
