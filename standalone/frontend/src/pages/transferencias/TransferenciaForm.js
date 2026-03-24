
import React, { useState, useEffect } from 'react';
import { 
    getMe, 
    getSucursales, 
    getInventario, 
    createTransferencia 
} from '../../services/apiService';
import { 
    IconArrowRight, 
    IconSearch, 
    IconShoppingCart, 
    IconTrash,
    IconSend
} from '@tabler/icons-react';

const TransferenciaForm = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [sucursales, setSucursales] = useState([]);
    const [selectedDestino, setSelectedDestino] = useState('');
    const [inventario, setInventario] = useState([]);
    const [filteredInventario, setFilteredInventario] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            const filtered = inventario.filter(item => 
                item.producto_nombre.toLowerCase().includes(lower) || 
                item.producto_codigo.toLowerCase().includes(lower)
            );
            setFilteredInventario(filtered);
        } else {
            setFilteredInventario(inventario);
        }
    }, [searchQuery, inventario]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const meRes = await getMe();
            setUserProfile(meRes.data);

            const sucursalesRes = await getSucursales();
            setSucursales(sucursalesRes.data);

            // Cargar inventario de mi sucursal
            if (meRes.data.sucursal_id) {
                const invRes = await getInventario(meRes.data.sucursal_id);
                // Filtrar solo productos con stock positivo para transferir
                const available = invRes.data.filter(item => parseFloat(item.cantidad) > 0);
                setInventario(available);
                setFilteredInventario(available);
            } else {
                setMessage({ text: 'Tu usuario no tiene una sucursal asignada. No puedes realizar transferencias.', type: 'error' });
            }
            
            setLoading(false);
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Error al cargar datos.', type: 'error' });
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        const existing = cart.find(c => c.producto === item.producto);
        if (existing) {
            return; // Ya está en el carrito
        }
        setCart([...cart, { ...item, cantidadTransferir: 1 }]);
    };

    const removeFromCart = (productoId) => {
        setCart(cart.filter(item => item.producto !== productoId));
    };

    const updateQuantity = (productoId, qty) => {
        const value = parseFloat(qty);
        if (isNaN(value) || value < 0) return;

        setCart(cart.map(item => {
            if (item.producto === productoId) {
                // Validar contra stock real
                if (value > parseFloat(item.cantidad)) {
                     // Podríamos mostrar error, por ahora limitamos o dejamos visual warning
                }
                return { ...item, cantidadTransferir: value };
            }
            return item;
        }));
    };

    const handleSubmit = async () => {
        if (!selectedDestino) {
            setMessage({ text: 'Selecciona una sucursal de destino.', type: 'error' });
            return;
        }
        if (cart.length === 0) {
            setMessage({ text: 'Agrega productos a la transferencia.', type: 'error' });
            return;
        }

        // Validar stocks
        for (let item of cart) {
            if (item.cantidadTransferir > parseFloat(item.cantidad)) {
                setMessage({ text: `Stock insuficiente para ${item.producto_nombre}. Disponibles: ${item.cantidad}`, type: 'error' });
                return;
            }
            if (item.cantidadTransferir <= 0) {
                 setMessage({ text: `La cantidad para ${item.producto_nombre} debe ser mayor a 0.`, type: 'error' });
                 return;
            }
        }

        try {
            setSubmitting(true);
            const payload = {
                sucursal_origen: userProfile.sucursal_id,
                sucursal_destino: selectedDestino,
                items: cart.map(item => ({
                    producto: item.producto,
                    cantidad: item.cantidadTransferir
                }))
            };

            await createTransferencia(payload);
            
            setMessage({ text: 'Transferencia realizada con éxito.', type: 'success' });
            setCart([]);
            setSearchQuery('');
            // Recargar inventario para actualizar stocks
            loadInitialData();
            
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Error al procesar transferencia: ' + (error.response?.data?.error || error.message), type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-4">Cargando...</div>;

    if (!userProfile?.sucursal_id) return (
        <div className="p-8 text-center text-red-500">
            <h2 className="text-xl font-bold">Sin Sucursal Asignada</h2>
            <p>Este usuario no pertenece a ninguna sucursal. Contacta al administrador.</p>
        </div>
    );

    const availableDestinations = sucursales.filter(s => s.id !== userProfile.sucursal_id);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Panel Izquierdo: Inventario */}
            <div className="w-1/2 flex flex-col border-r border-gray-300 bg-white">
                <div className="p-4 bg-gray-800 text-white shadow">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        Origen: {userProfile.sucursal_nombre}
                    </h2>
                    <p className="text-sm text-gray-400">Selecciona productos de tu inventario</p>
                </div>
                
                <div className="p-4 border-b">
                     <div className="relative">
                        <IconSearch className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Buscar producto por nombre o código..." 
                            className="w-full pl-10 pr-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredInventario.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">No hay productos disponibles.</div>
                    ) : (
                        filteredInventario.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-800">{item.producto_nombre}</div>
                                    <div className="text-xs text-gray-500">Cod: {item.producto_codigo}</div>
                                    <div className="text-sm text-blue-600 font-medium">Disponible: {parseFloat(item.cantidad).toFixed(2)}</div>
                                </div>
                                <button 
                                    onClick={() => addToCart(item)}
                                    disabled={cart.some(c => c.producto === item.producto)}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                        cart.some(c => c.producto === item.producto) 
                                        ? 'bg-gray-300 text-gray-500' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {cart.some(c => c.producto === item.producto) ? 'Agregado' : 'Agregar'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Panel Derecho: Carrito de Transferencia */}
            <div className="w-1/2 flex flex-col bg-gray-50">
                <div className="p-4 bg-white border-b shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal Destino:</label>
                    <div className="flex gap-2">
                        <select 
                            value={selectedDestino} 
                            onChange={(e) => setSelectedDestino(e.target.value)}
                            className="flex-1 border-gray-300 border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">-- Seleccionar Destino --</option>
                            {availableDestinations.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                         <button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            className={`flex items-center gap-2 px-4 py-2 rounded text-white shadow-sm transition-colors ${
                                submitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            <IconSend size={18} />
                            {submitting ? 'Enviando...' : 'Transferir'}
                        </button>
                    </div>
                   
                    {message.text && (
                        <div className={`mt-3 p-2 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <IconShoppingCart size={20} />
                        Items a Transferir ({cart.length})
                    </h3>
                    
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            Agrega productos del panel izquierdo.
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.producto} className="flex items-center justify-between p-3 bg-white rounded shadow-sm border border-gray-200">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">{item.producto_nombre}</div>
                                    <div className="text-xs text-gray-500">Max: {item.cantidad}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1">Cantidad</label>
                                        <input 
                                            type="number" 
                                            min="0.01" 
                                            step="0.01"
                                            max={item.cantidad}
                                            value={item.cantidadTransferir}
                                            onChange={(e) => updateQuantity(item.producto, e.target.value)}
                                            className={`w-24 p-1 border rounded text-right focus:outline-none focus:ring-1 ${
                                                item.cantidadTransferir > parseFloat(item.cantidad) 
                                                ? 'border-red-500 bg-red-50 text-red-700' 
                                                : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.producto)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                    >
                                        <IconTrash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
            </div>
        </div>
    );
};

export default TransferenciaForm;
