import React, { useState, useEffect, useMemo } from 'react';
import { getProductos, getProveedores, createOrdenCompra, getOrdenesCompra } from '../../services/apiService';
import { TrashIcon } from '../../components/shared/Icons'; // Reusamos el icono


const OrdenCompraForm = ({ onSave, onCancel }) => {
  // Estados para los catálogos
  const [allProducts, setAllProducts] = useState([]);
  const [allProveedores, setAllProveedores] = useState([]);

  // Estados del formulario
  const [proveedorId, setProveedorId] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  // Estados para el buscador de productos
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar catálogos
  useEffect(() => {
    const loadData = async () => {
      try {
        const resProd = await getProductos();
        setAllProducts(resProd.data);
        const resProv = await getProveedores();
        setAllProveedores(resProv.data);
      } catch (err) {
        setError('Error al cargar catálogos.');
      }
    };
    loadData();
  }, []);

  // Buscador de productos
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return allProducts.filter(p =>
      p.descripcion.toLowerCase().includes(lowerSearch) ||
      p.codigo_barras.toLowerCase().includes(lowerSearch)
    ).slice(0, 5);
  }, [searchTerm, allProducts]);

  // Añadir producto a la lista de items
  const addProducto = (product) => {
    if (items.find(item => item.producto_id === product.id)) {
      return; // Ya está en la lista
    }
    setItems(prev => [
      ...prev,
      {
        producto_id: product.id,
        nombre: product.descripcion,
        cantidad: 1,
        costo_unitario: product.costo // Usar el último costo como default
      }
    ]);
    setSearchTerm('');
  };

  // Actualizar un item (cantidad o costo)
  const updateItem = (index, field, value) => {
    setItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Quitar un item
  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular total (solo visual)
  const totalCosto = useMemo(() => {
    return items.reduce((acc, item) => {
      const cant = parseFloat(item.cantidad) || 0;
      const costo = parseFloat(item.costo_unitario) || 0;
      return acc + (cant * costo);
    }, 0);
  }, [items]);

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Debe agregar al menos un producto a la orden.');
      return;
    }
    if (!proveedorId) {
      setError('Debe seleccionar un proveedor.');
      return;
    }

    const payload = {
      proveedor_id: proveedorId,
      fecha_entrega_esperada: fechaEntrega || null,
      notas: notas,
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario
      }))
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-md p-6 rounded-lg mb-6">
      <h3 className="text-xl text-white mb-4">Nueva Orden de Compra</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Encabezado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-700 text-sm mb-1">Proveedor *</label>
          <select
            value={proveedorId}
            onChange={e => setProveedorId(e.target.value)}
            className="p-2 bg-gray-700 rounded w-full"
            required
          >
            <option value="">-- Seleccionar Proveedor --</option>
            {allProveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre_comercial} ({p.rfc})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm mb-1">Fecha Entrega (Opcional)</label>
          <input
            type="date"
            value={fechaEntrega}
            onChange={e => setFechaEntrega(e.target.value)}
            className="p-2 bg-gray-700 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm mb-1">Notas (Opcional)</label>
          <input
            type="text"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Ej: Pedido semanal"
            className="p-2 bg-gray-700 rounded w-full"
          />
        </div>
      </div>

      {/* Buscador de Productos */}
      <div className="mt-6 relative">
        <label className="block text-gray-700 text-sm mb-1">Buscar Producto</label>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por código o descripción..."
          className="p-2 bg-gray-700 rounded w-full"
        />
        {filteredProducts.length > 0 && (
          <div className="absolute z-10 w-full bg-gray-50 border border-gray-100 rounded-b shadow-lg max-h-48 overflow-y-auto">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addProducto(p)}
                className="p-2 hover:bg-cyan-700 cursor-pointer"
              >
                {p.descripcion} ({p.codigo_barras})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items de la Orden */}
      <div className="mt-6 space-y-2">
        <h4 className="text-lg text-white">Productos en esta Orden</h4>
        {items.length === 0 && <p className="text-gray-600">Agregue productos usando el buscador.</p>}

        {items.map((item, index) => (
          <div key={item.producto_id} className="bg-gray-700 p-2 rounded grid grid-cols-4 gap-2 items-center">
            <span className="truncate col-span-2">{item.nombre}</span>
            <input
              type="number"
              value={item.cantidad}
              onChange={e => updateItem(index, 'cantidad', e.target.value)}
              placeholder="Cantidad"
              className="p-2 bg-gray-50 border border-gray-100 rounded w-full"
            />
            <input
              type="number"
              value={item.costo_unitario}
              onChange={e => updateItem(index, 'costo_unitario', e.target.value)}
              placeholder="Costo Unit."
              step="0.01"
              className="p-2 bg-gray-50 border border-gray-100 rounded w-full"
            />
            <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400 col-start-4">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {/* Total y Botones */}
      <div className="mt-6 border-t border-gray-200 pt-4 flex justify-between items-center">
        <div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
            Guardar Orden de Compra
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-50 border border-gray-100 hover:bg-gray-500 text-gray-800 py-2 px-4 rounded">
            Cancelar
          </button>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Total de Orden:</p>
          <p className="text-2xl font-bold">${totalCosto.toFixed(2)}</p>
        </div>
      </div>
    </form>
  );
};


const OrdenCompra = () => {
  const [showForm, setShowForm] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrdenes = async () => {
    try {
      setIsLoading(true);
      const res = await getOrdenesCompra();
      setOrdenes(res.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las órdenes de compra.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const handleSave = async (payload) => {
    try {
      await createOrdenCompra(payload);
      setShowForm(false);
      fetchOrdenes(); // Recargar la lista
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la orden.');
    }
  };

  const EstadoTag = ({ estado }) => {
    let color = 'bg-gray-500';
    if (estado === 'pendiente') color = 'bg-yellow-500 text-black';
    if (estado === 'recibida') color = 'bg-green-500 text-white';
    if (estado === 'cancelada') color = 'bg-red-500 text-white';
    return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{estado}</span>;
  };

  return (
    <div className="w-full max-w-6xl p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Órdenes de Compra</h2>
      {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
          + Nueva Orden de Compra
        </button>
      ) : (
        <OrdenCompraForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white border border-gray-200 shadow-md rounded shadow-md overflow-x-auto">
        <h3 className="text-xl text-white p-4">Historial de Órdenes de Compra</h3>
        {isLoading && <p className="p-4 text-gray-600">Cargando...</p>}
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4">ID</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Proveedor</th>
              <th className="p-4">Creada por</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map(o => (
              <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="p-4">OC-{o.id}</td>
                <td className="p-4">{new Date(o.fecha_creacion).toLocaleDateString()}</td>
                <td className="p-4">{o.proveedor_nombre || 'N/A'}</td>
                <td className="p-4">{o.usuario_username}</td>
                <td className="p-4">${o.total}</td>
                <td className="p-4"><EstadoTag estado={o.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdenCompra;