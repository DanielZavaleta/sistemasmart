from django.contrib.auth.models import User, Group, Permission
from rest_framework import serializers
import decimal
from django.db import transaction 


from .models import (
    Producto, Familia, Subfamilia, Cliente, Proveedor,
    Venta, VentaItem, VentaPago,
    EntradaStock, EntradaStockItem,
    AjusteStock,
    OrdenCompra, OrdenCompraItem,
    PagoProveedor,
    MovimientoCliente,
    CorteCaja,
    Sucursal,
    TicketSuspendido,
    RetiroCaja,
    Configuracion,
    ProductoComponente,
    Descuento,
    Inventario,
    Transferencia,
    TransferenciaItem
)


class ConfiguracionSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Configuracion
        fields = [
            'id', 'nombre_tienda', 'direccion', 'telefono', 'rfc', 'mensaje_ticket',
            'logo', 'encabezado_personalizado', 'ticket_font_size',
            'mostrar_logo', 'mostrar_encabezado', 'mostrar_pie'
        ]


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']


class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(
        many=True,
        slug_field='codename',
        queryset=Permission.objects.all(),
        required=False
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.SerializerMethodField()
    sucursal = serializers.SerializerMethodField()
    groups = GroupSerializer(many=True, read_only=True)
    group_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Group.objects.all(), write_only=True, required=False, source='groups'
    )
    sucursal_id = serializers.PrimaryKeyRelatedField(
        queryset=Sucursal.objects.all(), source='perfil.sucursal', required=False, allow_null=True
    )
    avatar = serializers.ImageField(source='perfil.avatar', required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'role', 'is_superuser', 'sucursal', 'sucursal_id', 'avatar', 'groups', 'group_ids']
    
    def get_role(self, obj):
        return obj.groups.first().name if obj.groups.exists() else 'N/A'

    def get_sucursal(self, obj):
        if hasattr(obj, 'perfil') and obj.perfil.sucursal:
            return obj.perfil.sucursal.nombre
        return 'Sin Sucursal'
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        profile_data = validated_data.pop('perfil', {})
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
            
        # Handle Profile creation with Sucursal
        from .models import PerfilUsuario
        perfil = PerfilUsuario.objects.create(usuario=user)
        if 'sucursal' in profile_data:
            perfil.sucursal = profile_data['sucursal']
        if 'avatar' in profile_data:
            perfil.avatar = profile_data['avatar']
        perfil.save()
            
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        profile_data = validated_data.pop('perfil', {})
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        instance.save()

        # Update Profile fields (avatar & sucursal)
        if profile_data:
            perfil = getattr(instance, 'perfil', None)
            if not perfil:
                from .models import PerfilUsuario
                perfil = PerfilUsuario.objects.create(usuario=instance)
            
            if 'sucursal' in profile_data:
                perfil.sucursal = profile_data['sucursal']
            if 'avatar' in profile_data:
                perfil.avatar = profile_data['avatar']
            perfil.save()
            
        return instance


class FamiliaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Familia
        fields = ['id', 'nombre']


class SubfamiliaSerializer(serializers.ModelSerializer):
    familia_nombre = serializers.CharField(source='familia.nombre', read_only=True)
    familia = serializers.PrimaryKeyRelatedField(queryset=Familia.objects.all(), write_only=True)
    class Meta:
        model = Subfamilia
        fields = ['id', 'nombre', 'familia', 'familia_nombre']


class ProductoComponenteSerializer(serializers.ModelSerializer):
    componente_nombre = serializers.CharField(source='componente.descripcion', read_only=True)
    componente = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    
    class Meta:
        model = ProductoComponente
        fields = ['id', 'componente', 'componente_nombre', 'cantidad']


class ProductoSerializer(serializers.ModelSerializer):
    subfamilia = SubfamiliaSerializer(read_only=True)
    subfamilia_id = serializers.PrimaryKeyRelatedField(queryset=Subfamilia.objects.all(), write_only=True, source='subfamilia', allow_null=True, required=False)
    componentes = ProductoComponenteSerializer(many=True, required=False)
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo_barras', 'descripcion', 'costo', 'stock_actual', 
            'tipo_venta', 'tasa_iva', 'tasa_ieps', 'porcentaje_utilidad', 'permite_descuento',
            'tipo_ganancia', 'ganancia_fija',
            'precio_1', 'precio_2', 'precio_3', 'precio_4', 'precio_5', 'precio_6', 
            'subfamilia', 'subfamilia_id', 'requiere_caducidad', 'fecha_caducidad',
            'clave_sat_unidad', 'clave_sat_producto', 'numero_identificacion', 'objeto_impuesto', 'imagen',
            'es_paquete', 'componentes'
        ]

    def create(self, validated_data):
        componentes_data = validated_data.pop('componentes', [])
        producto = super().create(validated_data)
        
        if producto.es_paquete:
            total_costo = 0
            for comp_data in componentes_data:
                ProductoComponente.objects.create(
                    paquete=producto,
                    componente=comp_data['componente'],
                    cantidad=comp_data['cantidad']
                )
                # Calculate cost
                costo_comp = comp_data['componente'].costo or 0
                total_costo += costo_comp * decimal.Decimal(comp_data['cantidad'])
            
            # Update product cost and prices
            producto.costo = total_costo
            
            # Calculate Price based on Profit Config
            costo_val = float(total_costo)
            iva_val = float(producto.tasa_iva)
            ieps_val = float(producto.tasa_ieps)
            base_ieps = costo_val * (1.0 + ieps_val)

            if producto.tipo_ganancia == 'fijo':
                ganancia = float(producto.ganancia_fija)
                # Price = (Cost + IEPS) + Fixed Profit + IVA
                # Usually fixed profit is before taxes or after? Let's assume before IVA but after Cost.
                # Let's say: Price = (Cost + IEPS + Profit) * (1 + IVA)
                con_utilidad = base_ieps + ganancia
            else:
                utilidad_val = float(producto.porcentaje_utilidad) / 100.0
                con_utilidad = base_ieps * (1.0 + utilidad_val)
            
            precio_final = con_utilidad * (1.0 + iva_val)
            producto.precio_1 = round(precio_final, 2)
            producto.save()
        return producto

    def update(self, instance, validated_data):
        componentes_data = validated_data.pop('componentes', None)
        instance = super().update(instance, validated_data)

        if instance.es_paquete and componentes_data is not None:
            instance.componentes.all().delete()
            total_costo = 0
            for comp_data in componentes_data:
                ProductoComponente.objects.create(
                    paquete=instance,
                    componente=comp_data['componente'],
                    cantidad=comp_data['cantidad']
                )
                costo_comp = comp_data['componente'].costo or 0
                total_costo += costo_comp * decimal.Decimal(comp_data['cantidad'])
            
            instance.costo = total_costo
            
            # Recalculate Price
            costo_val = float(total_costo)
            iva_val = float(instance.tasa_iva)
            ieps_val = float(instance.tasa_ieps)
            base_ieps = costo_val * (1.0 + ieps_val)

            if instance.tipo_ganancia == 'fijo':
                ganancia = float(instance.ganancia_fija)
                con_utilidad = base_ieps + ganancia
            else:
                utilidad_val = float(instance.porcentaje_utilidad) / 100.0
                con_utilidad = base_ieps * (1.0 + utilidad_val)
            
            precio_final = con_utilidad * (1.0 + iva_val)
            instance.precio_1 = round(precio_final, 2)
            instance.save()
            
        return instance



class DescuentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Descuento
        fields = ['id', 'porcentaje', 'descripcion']


class ClienteSerializer(serializers.ModelSerializer):
    descuento_data = DescuentoSerializer(source='descuento', read_only=True)
    descuento_id = serializers.PrimaryKeyRelatedField(
        queryset=Descuento.objects.all(), 
        source='descuento', 
        write_only=True, 
        allow_null=True,
        required=False
    )

    class Meta:
        model = Cliente
        fields = ['id', 'rfc', 'razon_social', 'nombre_comercial', 'email', 'telefono', 'direccion', 'cp', 'credito_disponible', 'limite_credito', 'descuento_data', 'descuento_id', 'regimen_fiscal', 'uso_cfdi', 'cp_fiscal']
        read_only_fields = ('credito_disponible',)





class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'rfc', 'razon_social', 'nombre_comercial', 'email', 'telefono']


class VentaPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VentaPago
        fields = ['metodo', 'monto', 'tipo_cambio']


class VentaItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    class Meta:
        model = VentaItem
        fields = ['producto_nombre', 'cantidad', 'precio_unitario', 'subtotal']


class VentaSerializer(serializers.ModelSerializer):
    items = VentaItemSerializer(many=True, read_only=True)
    pagos = VentaPagoSerializer(many=True, read_only=True)
    cajero_username = serializers.CharField(source='cajero.username', read_only=True)
    class Meta:
        model = Venta
        fields = ['id', 'cajero_username', 'cliente', 'total', 'creado_en', 'items', 'pagos']


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = ['id', 'nombre', 'direccion']


class EntradaStockItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all(), source='producto', write_only=True)
    class Meta:
        model = EntradaStockItem
        fields = ['id', 'producto_id', 'producto_nombre', 'cantidad', 'costo_unitario', 'tasa_iva', 'tasa_ieps', 'precio_venta_sugerido', 'fecha_caducidad']


class EntradaStockSerializer(serializers.ModelSerializer):
    items = EntradaStockItemSerializer(many=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True, allow_null=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all(), source='proveedor', write_only=True, allow_null=True, required=False)
    sucursal_origen_nombre = serializers.CharField(source='sucursal_origen.nombre', read_only=True, allow_null=True)
    sucursal_origen_id = serializers.PrimaryKeyRelatedField(queryset=Sucursal.objects.all(), source='sucursal_origen', write_only=True, allow_null=True, required=False)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True, allow_null=True)
    sucursal_id = serializers.PrimaryKeyRelatedField(queryset=Sucursal.objects.all(), source='sucursal', write_only=True, allow_null=True, required=False)
    
    class Meta:
        model = EntradaStock
        fields = ['id', 'tipo', 'proveedor_id', 'proveedor_nombre', 'sucursal_origen_id', 'sucursal_origen_nombre', 'sucursal_id', 'sucursal_nombre', 'factura', 'usuario_username', 'fecha', 'notas', 'total_costo', 'items']
        read_only_fields = ('total_costo', 'usuario_username', 'fecha')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        validated_data['usuario'] = user
        
        # Fallback to user sucursal if not provided
        if 'sucursal' not in validated_data:
             validated_data['sucursal'] = user.perfil.sucursal if hasattr(user, 'perfil') else None
             
        total_costo = decimal.Decimal('0.00')
        try:
            with transaction.atomic():
                entrada = EntradaStock.objects.create(**validated_data)
                for item_data in items_data:
                    cantidad = item_data['cantidad']
                    costo_unitario = item_data['costo_unitario']
                    
                    EntradaStockItem.objects.create(
                        entrada=entrada, 
                        producto=item_data['producto'], 
                        cantidad=cantidad, 
                        cantidad_disponible=cantidad, # Initialize FIFO availability
                        costo_unitario=costo_unitario, 
                        fecha_caducidad=item_data.get('fecha_caducidad', None),
                        tasa_iva=item_data.get('tasa_iva', 0.00),
                        tasa_ieps=item_data.get('tasa_ieps', 0.00),
                        precio_venta_sugerido=item_data.get('precio_venta_sugerido', 0.00)
                    )
                    
                    producto = item_data['producto']
                    producto.stock_actual += cantidad
                    producto.costo = costo_unitario 
                    
                    # Update Inventario
                    from .models import Inventario
                    if entrada.sucursal:
                         inv, _ = Inventario.objects.get_or_create(sucursal=entrada.sucursal, producto=producto, defaults={'cantidad': 0})
                         inv.cantidad += cantidad
                         inv.save()
                    
                    # Actualizar precio de venta si viene sugerido (HU-20 / 7.5)
                    sugerido = item_data.get('precio_venta_sugerido', 0.00)
                    if sugerido and float(sugerido) > 0:
                        producto.precio_1 = sugerido
                        # Podríamos recalcular precio_2..6 basándonos en reglas, pero por ahora precio_1 es el crítico.
                    
                    # Sincronizar fecha de caducidad global del producto (la más cercana)
                    nueva_f = item_data.get('fecha_caducidad', None)
                    if nueva_f:
                        if not producto.fecha_caducidad or nueva_f < producto.fecha_caducidad:
                            producto.fecha_caducidad = nueva_f
                    
                    producto.save()
                    
                    # El total costo de la entrada es la suma de (cantidad * costo_unitario)
                    # OJO: ¿Debe incluir impuestos? Generalmente el costo de entrada es neto o bruto.
                    # Asumiremos costo * cantidad como base para el reporte de inversión.
                    total_costo += (cantidad * costo_unitario)

                entrada.total_costo = total_costo
                entrada.save()
            return entrada
        except Exception as e:
            raise serializers.ValidationError(str(e))


class AjusteStockSerializer(serializers.ModelSerializer):
    producto_id = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all(), source='producto', write_only=True)
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True, allow_null=True)
    sucursal_id = serializers.PrimaryKeyRelatedField(queryset=Sucursal.objects.all(), source='sucursal', write_only=True, allow_null=True, required=False)
    
    class Meta:
        model = AjusteStock
        fields = ['id', 'fecha', 'producto_id', 'producto_nombre', 'usuario_username', 'sucursal_id', 'sucursal_nombre', 'cantidad_anterior', 'cantidad_nueva', 'diferencia', 'notas']
        read_only_fields = ('id', 'fecha', 'usuario_username', 'cantidad_anterior', 'diferencia')
    def create(self, validated_data):

        producto = validated_data.get('producto')
        cantidad_nueva = validated_data.get('cantidad_nueva')
        usuario = self.context['request'].user
        # Fallback to user sucursal
        if 'sucursal' not in validated_data:
             validated_data['sucursal'] = usuario.perfil.sucursal if hasattr(usuario, 'perfil') else None
             
        try:
            with transaction.atomic():
                cantidad_anterior = producto.stock_actual
                diferencia = cantidad_nueva - cantidad_anterior
                ajuste = AjusteStock.objects.create(producto=producto, usuario=usuario, sucursal=validated_data['sucursal'], cantidad_anterior=cantidad_anterior, cantidad_nueva=cantidad_nueva, diferencia=diferencia, notas=validated_data.get('notes', ''))
                producto.stock_actual = cantidad_nueva
                producto.save()
                
                # Update Inventario
                from .models import Inventario
                if ajuste.sucursal:
                    inv, _ = Inventario.objects.get_or_create(sucursal=ajuste.sucursal, producto=producto, defaults={'cantidad': 0})
                    inv.cantidad = cantidad_nueva
                    inv.save()
                return ajuste
        except Exception as e:
            raise serializers.ValidationError(str(e))


class OrdenCompraItemSerializer(serializers.ModelSerializer):
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto'
    )
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    
    class Meta:
        model = OrdenCompraItem
        fields = ['id', 'producto_id', 'producto_nombre', 'cantidad', 'costo_unitario']


class OrdenCompraSerializer(serializers.ModelSerializer):
    items = OrdenCompraItemSerializer(many=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.all(), source='proveedor'
    )
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = OrdenCompra
        fields = [
            'id', 'proveedor_id', 'proveedor_nombre', 'usuario_username', 
            'fecha_creacion', 'fecha_entrega_esperada', 'estado', 
            'total', 'notas', 'items'
        ]
        read_only_fields = ('total', 'usuario_username', 'fecha_creacion', 'estado')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['usuario'] = self.context['request'].user
        
        total = decimal.Decimal('0.00')

        try:
            with transaction.atomic():

                orden = OrdenCompra.objects.create(**validated_data)
                

                for item_data in items_data:
                    cantidad = item_data['cantidad']
                    costo_unitario = item_data['costo_unitario']
                    
                    OrdenCompraItem.objects.create(
                        orden_compra=orden,
                        producto=item_data['producto'],
                        cantidad=cantidad,
                        costo_unitario=costo_unitario
                    )
                    total += (cantidad * costo_unitario)
                

                orden.total = total
                orden.save()

            return orden
        
        except Exception as e:
            raise serializers.ValidationError(str(e))


class PagoProveedorSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_comercial', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    proveedor_id = serializers.PrimaryKeyRelatedField(queryset=Proveedor.objects.all(), source='proveedor', write_only=True)
    orden_compra_id = serializers.PrimaryKeyRelatedField(queryset=OrdenCompra.objects.all(), source='orden_compra', write_only=True, allow_null=True, required=False)

    class Meta:
        model = PagoProveedor
        fields = [
            'id', 'proveedor_id', 'proveedor_nombre', 'orden_compra', 'orden_compra_id',
            'usuario_username', 'fecha', 'monto', 'metodo', 'referencia', 'notas'
        ]
        read_only_fields = ('fecha', 'usuario_username')

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)


class MovimientoClienteSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all(), source='cliente', write_only=True)
    
    class Meta:
        model = MovimientoCliente
        fields = ['id', 'cliente_id', 'cliente_nombre', 'tipo', 'monto', 'fecha', 'notas']
        read_only_fields = ('fecha',)


    def create(self, validated_data):
        # Validar que sea un abono (los cargos se crean desde Venta)
        if validated_data.get('tipo') != 'abono':
            raise serializers.ValidationError("Solo se pueden registrar abonos manualmente.")
        return super().create(validated_data)


class TicketSuspendidoSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.razon_social', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = TicketSuspendido
        fields = ['id', 'cliente', 'cliente_nombre', 'items_json', 'creado_en', 'usuario', 'usuario_nombre']


class CorteCajaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = CorteCaja
        fields = [
            'id', 'usuario_username', 'fecha', 
            'total_ventas', 'total_efectivo_sistema', 'total_tarjeta_sistema', 'total_credito_sistema',
            'dinero_en_caja', 'diferencia', 'notas', 'detalles'
        ]
        read_only_fields = ('fecha', 'usuario_username')

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        # La diferencia se calcula en la vista antes de guardar, o aquí si se pasan los totales
        # Pero mejor dejar que la vista maneje la lógica de negocio o el serializer si se le pasan los datos
        return super().create(validated_data)


class CaducidadSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo_barras', read_only=True)
    proveedor_nombre = serializers.CharField(source='entrada.proveedor.nombre_comercial', read_only=True, allow_null=True)
    fecha_entrada = serializers.DateTimeField(source='entrada.fecha', read_only=True)
    
    class Meta:
        model = EntradaStockItem
        fields = ['id', 'producto_nombre', 'producto_codigo', 'cantidad_disponible', 'fecha_caducidad', 'costo_unitario', 'proveedor_nombre', 'fecha_entrada']


class RetiroCajaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = RetiroCaja
        fields = ['id', 'fecha', 'monto', 'motivo', 'usuario_username']
        read_only_fields = ('fecha', 'usuario_username')


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = '__all__'


class InventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo_barras', read_only=True)
    sucursal_nombre = serializers.CharField(source='sucursal.nombre', read_only=True)

    class Meta:
        model = Inventario
        fields = ['id', 'sucursal', 'sucursal_nombre', 'producto', 'producto_codigo', 'producto_nombre', 'cantidad', 'ubicacion']


class TransferenciaItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.descripcion', read_only=True)
    
    class Meta:
        model = TransferenciaItem
        fields = ['id', 'producto', 'producto_nombre', 'cantidad']


class TransferenciaSerializer(serializers.ModelSerializer):
    items = TransferenciaItemSerializer(many=True)
    sucursal_origen_nombre = serializers.CharField(source='sucursal_origen.nombre', read_only=True)
    sucursal_destino_nombre = serializers.CharField(source='sucursal_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Transferencia
        fields = ['id', 'sucursal_origen', 'sucursal_origen_nombre', 'sucursal_destino', 'sucursal_destino_nombre', 'usuario', 'usuario_nombre', 'fecha_creacion', 'fecha_completada', 'estado', 'notas', 'items']
        read_only_fields = ['fecha_creacion', 'fecha_completada', 'usuario']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        validated_data['usuario'] = user
        
        transferencia = Transferencia.objects.create(**validated_data)

        for item_data in items_data:
            TransferenciaItem.objects.create(transferencia=transferencia, **item_data)
        
        return transferencia
