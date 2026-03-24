import React, { useState, useEffect, useMemo } from 'react';
import { getProductos, getProveedores, createEntradaStock, getEntradasStock, getSucursales } from '../../services/apiService';
import { TrashIcon } from '../../components/shared/Icons';


const EntradaStockForm = ({ onSave, onCancel }) => {
  const [tipoEntrada, setTipoEntrada] = useState('COMPRA'); // COMPRA | TRANSFERENCIA
  const [allProducts, setAllProducts] = useState([]);
  const [allProveedores, setAllProveedores] = useState([]);
  const [allSucursales, setAllSucursales] = useState([]);

  const [proveedorId, setProveedorId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [factura, setFactura] = useState('');
  const [notas, setNotas] = useState('');

  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resProd, resProv, resSuc] = await Promise.all([
          getProductos(),
          getProveedores(),
          getSucursales().catch(() => ({ data: [] })) // Handle error if sucursales endpoint fails or is empty
        ]);
        setAllProducts(resProd.data);
        setAllProveedores(resProv.data);
        setAllSucursales(resSuc.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar catálogos.');
      }
    };
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return allProducts.filter(p =>
      p.descripcion.toLowerCase().includes(lowerSearch) ||
      p.codigo_barras.toLowerCase().includes(lowerSearch)
    ).slice(0, 5);
  }, [searchTerm, allProducts]);


  const addProducto = (product) => {
    if (items.find(item => item.producto_id === product.id)) {
      setSearchTerm('');
      return;
    }
    setItems(prev => [
      ...prev,
      {
        producto_id: product.id,
        nombre: product.descripcion,
        codigo: product.codigo_barras,
        cantidad: 1,
        costo_unitario: product.costo || 0,
        tasa_ieps: product.tasa_ieps ?? 0,
        tasa_iva: product.tasa_iva ?? 0.16,
        precio_venta_sugerido: product.precio_1 || 0,
        porcentaje_utilidad: product.porcentaje_utilidad || 0,
        requiere_caducidad: product.requiere_caducidad,
        fecha_caducidad: null
      }
    ]);
    setSearchTerm('');
  };

  const updateItem = (index, field, value) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updatedItem = { ...item, [field]: value };

        // Auto-calc Suggested Price on Cost Change
        if (field === 'costo_unitario') {
          const cost = parseFloat(value) || 0;
          const margin = parseFloat(item.porcentaje_utilidad) || 0;
          // Simple logic: Price = Cost + (Cost * Margin/100)
          // Note: Does not account for Tax compounding here, keeping strict margin on cost.
          const newPrice = cost * (1 + (margin / 100));
          updatedItem.precio_venta_sugerido = newPrice.toFixed(2);
        }

        return updatedItem;
      })
    );
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (item) => {
    const qty = parseFloat(item.cantidad) || 0;
    const cost = parseFloat(item.costo_unitario) || 0;
    // Subtotal simple: Cantidad * Costo. 
    // Si se requiere con impuestos: cost * (1 + item.tasa_iva + item.tasa_ieps/100)
    return qty * cost;
  };

  const totalCosto = useMemo(() => {
    return items.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  }, [items]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Debe agregar al menos un producto.');
      return;
    }

    if (tipoEntrada === 'COMPRA' && !proveedorId) {
      // Optional validation, maybe allowed if it's "Adjustment" but UI says "Compra" needs Proveedor often.
      // Let's keep it optional but warn? No, user requested form.
    }

    if (tipoEntrada === 'TRANSFERENCIA' && !sucursalId) {
      setError('Debe seleccionar la sucursal de origen.');
      return;
    }

    for (const item of items) {
      if (item.requiere_caducidad && !item.fecha_caducidad) {
        setError(`El producto "${item.nombre}" requiere una fecha de caducidad.`);
        return;
      }
    }

    const payload = {
      tipo: tipoEntrada,
      proveedor_id: tipoEntrada === 'COMPRA' ? (proveedorId || null) : null,
      sucursal_origen_id: tipoEntrada === 'TRANSFERENCIA' ? sucursalId : null,
      factura: tipoEntrada === 'COMPRA' ? factura : null,
      notas: notas,
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        tasa_iva: item.tasa_iva,
        tasa_ieps: item.tasa_ieps,
        precio_venta_sugerido: item.precio_venta_sugerido,
        fecha_caducidad: item.fecha_caducidad
      }))
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-6 shadow-xl border border-gray-700">
      <h3 className="text-2xl text-white mb-6 font-semibold border-b border-gray-700 pb-2">
        Registro de {tipoEntrada === 'COMPRA' ? 'Compras' : 'Transferencias'}
      </h3>

      {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-6 border border-red-500/50">{error}</div>}

      {/* TIPO DE OPERACIÓN */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={tipoEntrada === 'COMPRA'}
            onChange={() => setTipoEntrada('COMPRA')}
            className="w-5 h-5 text-blue-600"
          />
          <span className="ml-2 text-white font-medium">Compra</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={tipoEntrada === 'TRANSFERENCIA'}
            onChange={() => setTipoEntrada('TRANSFERENCIA')}
            className="w-5 h-5 text-blue-600"
          />
          <span className="ml-2 text-white font-medium">Transferencia</span>
        </label>
      </div>

      {/* HEADER FORM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-gray-750 p-4 rounded">
        {tipoEntrada === 'COMPRA' ? (
          <>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-xs uppercase mb-1">Proveedor</label>
              <select
                value={proveedorId}
                onChange={e => setProveedorId(e.target.value)}
                className="p-2.5 bg-gray-700 border border-gray-600 rounded w-full text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {allProveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_comercial} ({p.rfc})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase mb-1">Factura / Folio</label>
              <input
                type="text"
                value={factura}
                onChange={e => setFactura(e.target.value)}
                className="p-2.5 bg-gray-700 border border-gray-600 rounded w-full text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-gray-400 text-xs uppercase mb-1">Sucursal Origen</label>
            <select
              value={sucursalId}
              onChange={e => setSucursalId(e.target.value)}
              className="p-2.5 bg-gray-700 border border-gray-600 rounded w-full text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Seleccionar Sucursal --</option>
              {allSucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>


      {/* BUSCADOR */}
      <div className="mb-6 relative">
        <label className="block text-gray-400 text-xs uppercase mb-1">Agregar Producto (Código o Nombre)</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-600 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-r w-full text-white focus:border-blue-500 focus:outline-none"
            placeholder="Escriba para buscar..."
          />
        </div>

        {filteredProducts.length > 0 && (
          <div className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-b shadow-xl max-h-60 overflow-y-auto">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addProducto(p)}
                className="p-3 hover:bg-blue-600 cursor-pointer text-white border-b border-gray-600 last:border-0"
              >
                <div className="font-bold">{p.descripcion}</div>
                <div className="text-xs text-gray-300">Código: {p.codigo_barras} | Costo: ${p.costo}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TABLA DE ITEMS */}
      <div className="overflow-x-auto rounded border border-gray-700 mb-6">
        <table className="w-full text-left bg-gray-700 text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 uppercase text-xs">
              <th className="p-3 font-medium">Código</th>
              <th className="p-3 font-medium">Descripción</th>
              <th className="p-3 font-medium w-32">Caducidad</th>
              <th className="p-3 font-medium w-24">Cant.</th>
              <th className="p-3 font-medium w-32">Costo ($)</th>
              <th className="p-3 font-medium w-20">IEPS %</th>
              <th className="p-3 font-medium w-32">P. Unit. ($)</th>
              <th className="p-3 font-medium w-24">IVA</th>
              <th className="p-3 font-medium text-right">Subtotal</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {items.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-gray-500">
                  No hay productos agregados. Use el buscador.
                </td>
              </tr>
            ) : items.map((item, index) => (
              <tr key={item.producto_id} className="hover:bg-gray-600/50">
                <td className="p-3 text-white">{item.codigo}</td>
                <td className="p-3 text-white">
                  {item.nombre}
                </td>
                <td className="p-3">
                  <input
                    type="date"
                    value={item.fecha_caducidad || ''}
                    onChange={e => updateItem(index, 'fecha_caducidad', e.target.value)}
                    className={`bg-gray-800 text-xs border rounded p-1 text-white w-full ${item.requiere_caducidad && !item.fecha_caducidad ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'}`}
                    required={item.requiere_caducidad}
                    title={item.requiere_caducidad ? "Requerido para pesecedros" : "Opcional"}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={e => updateItem(index, 'cantidad', e.target.value)}
                    className="bg-white text-black p-1 rounded w-full border-none focus:ring-2 ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number" step="0.01"
                    value={item.costo_unitario}
                    onChange={e => updateItem(index, 'costo_unitario', e.target.value)}
                    className="bg-white text-black p-1 rounded w-full border-none focus:ring-2 ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number" step="0.01"
                    value={item.tasa_ieps}
                    onChange={e => updateItem(index, 'tasa_ieps', e.target.value)}
                    className="bg-white text-black p-1 rounded w-full border-none focus:ring-2 ring-blue-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number" step="0.01"
                    value={item.precio_venta_sugerido}
                    onChange={e => updateItem(index, 'precio_venta_sugerido', e.target.value)}
                    className="bg-white text-black p-1 rounded w-full border-none focus:ring-2 ring-blue-500 font-bold text-blue-800"
                  />
                </td>
                <td className="p-3">
                  <select
                    value={item.tasa_iva}
                    onChange={e => updateItem(index, 'tasa_iva', e.target.value)}
                    className="bg-white text-black p-1 rounded w-full border-none focus:ring-2 ring-blue-500"
                  >
                    <option value="0">0%</option>
                    <option value="0.08">8%</option>
                    <option value="0.16">16%</option>
                  </select>
                </td>
                <td className="p-3 text-right text-white font-mono">
                  ${calculateSubtotal(item).toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-200">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div className="flex justify-between items-center border-t border-gray-700 pt-4">
        <div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded mr-3 shadow-lg transform hover:-translate-y-0.5 transition-all">
            Guardar {tipoEntrada === 'COMPRA' ? 'Compra' : 'Transferencia'}
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white py-2.5 px-6 rounded">
            Cancelar
          </button>
        </div>
        <div className="text-right">
          <p className="text-gray-400 uppercase text-xs">Total Operación</p>
          <p className="text-3xl font-bold text-green-400">${totalCosto.toFixed(2)}</p>
        </div>
      </div>
    </form>
  );
};


const EntradaStock = () => {
  const [showForm, setShowForm] = useState(false);
  const [entradas, setEntradas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntradas = async () => {
    try {
      setIsLoading(true);
      const res = await getEntradasStock();
      setEntradas(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar historial.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntradas();
  }, []);

  const handleSave = async (payload) => {
    try {
      await createEntradaStock(payload);
      setShowForm(false);
      fetchEntradas();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    }
  };

  return (
    <div className="w-full max-w-7xl p-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Entrada de Mercancía / Compras</h2>
      </div>

      {error && <p className="text-red-500 bg-red-200/10 border border-red-500/30 p-4 rounded mb-6">{error}</p>}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg mb-8 flex items-center gap-2"
        >
          <span>+</span> Nueva Compra / Transferencia
        </button>
      ) : (
        <EntradaStockForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}


      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        <h3 className="text-xl text-white p-6 bg-gray-900/50 border-b border-gray-700">Historial de Operaciones</h3>
        {isLoading ? <p className="p-8 text-gray-400 text-center animate-pulse">Cargando datos...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-900 text-gray-300 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Origen (Prov/Suc)</th>
                  <th className="p-4">Factura</th>
                  <th className="p-4">Registró</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {entradas.map(e => (
                  <tr key={e.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-gray-300 font-mono">#{e.id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${e.tipo === 'COMPRA' ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'}`}>
                        {e.tipo || 'COMPRA'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{new Date(e.fecha).toLocaleDateString()} {new Date(e.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4 text-white font-medium">
                      {e.tipo === 'TRANSFERENCIA'
                        ? (e.sucursal_origen_nombre || 'N/A')
                        : (e.proveedor_nombre || 'Ajuste')}
                    </td>
                    <td className="p-4 text-gray-400">{e.factura || '-'}</td>
                    <td className="p-4 text-gray-400 text-sm">{e.usuario_username}</td>
                    <td className="p-4 text-right text-green-400 font-bold font-mono">${e.total_costo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntradaStock;