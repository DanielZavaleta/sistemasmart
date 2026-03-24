import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductos, createProducto, updateProducto, deleteProducto, getSubfamilias } from '../../services/apiService';
import { TrashIcon } from '../../components/shared/Icons';

// --- Subcomponente: Formulario de Producto (Modern Modal) ---
const ProductoForm = ({ selectedProducto, onSave, onCancel, catalog = [] }) => {
  const initialState = {
    codigo_barras: '',
    descripcion: '',

    // SAT & Clasificacion
    clave_sat_unidad: 'H87', // Por defecto Pieza
    clave_sat_producto: '01010101',
    numero_identificacion: '',
    objeto_impuesto: '02',
    subfamilia_id: '',

    // Checkboxes
    tipo_venta: 'UNIDAD',
    venta_granel: false,
    requiere_caducidad: false,
    permite_descuento: true,

    // Costos e Impuestos
    costo: 0.00,
    tasa_iva: 0.16,
    tasa_ieps: 0.00,
    porcentaje_utilidad: 0.00,

    // Inventario
    stock_actual: 0.00,

    // Precios
    // Precios
    precio_1: 0.00,
    precio_2: 0.00,
    precio_3: 0.00,
    precio_4: 0.00,
    precio_5: 0.00,
    precio_6: 0.00,

    fecha_caducidad: '',
    imagen: null,

    // Kits/Paquetes
    es_paquete: false,
    componentes: [], // Array de { componente: id, cantidad: 1, ... }
    tipo_ganancia: 'porcentaje', // 'porcentaje' | 'fijo'
    ganancia_fija: 0.00,
  };

  const [producto, setProducto] = useState(initialState);
  const [subfamilias, setSubfamilias] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // State para buscador de componentes
  const [compSearch, setCompSearch] = useState('');

  // Helpers para calcular ganancias
  const calculateGanancia = (precio, costo) => {
    const p = parseFloat(precio) || 0;
    const c = parseFloat(costo) || 0;
    if (c <= 0) return 0.00;
    return (((p - c) / c) * 100).toFixed(2);
  };

  const getCostoNeto = () => {
    const c = parseFloat(producto.costo) || 0;
    const iva = parseFloat(producto.tasa_iva) || 0;
    const ieps = parseFloat(producto.tasa_ieps) || 0;
    return (c * (1 + iva + ieps)).toFixed(2);
  };

  // Recalculate Package Cost when components change
  useEffect(() => {
    if (producto.es_paquete) {
       let totalCosto = 0;
       producto.componentes.forEach(comp => {
           // We need the cost of the component. 
           // If 'comp' comes from DB it might not have 'costo' field directly visible (check serializer).
           // If 'comp' comes from catalog search, it has 'costo'.
           // Ideally, we stored 'costo' in the component list or look it up.
           // Since catalog has full objects, let's assume we can find it.
           const catProd = catalog.find(p => p.id === comp.componente);
           if (catProd) {
               totalCosto += (parseFloat(catProd.costo) || 0) * parseFloat(comp.cantidad);
           }
       });
       if (totalCosto !== producto.costo) {
           setProducto(prev => ({ ...prev, costo: totalCosto }));
       }
    }
  }, [producto.es_paquete, producto.componentes, catalog]);

  // Recálculo automático de precios sugeridos al cambiar costo o utilidad o ganancia fija
  useEffect(() => {
    // Only auto-calc if explicitly desired or strictly for packages?
    // Let's force it for packages to ensure consistency with backend logic.
    if (producto.es_paquete) {
        const costo = parseFloat(producto.costo) || 0;
        const iva = parseFloat(producto.tasa_iva) || 0;
        const ieps = parseFloat(producto.tasa_ieps) || 0;
        const base_ieps = costo * (1.0 + ieps);
        let precio_sugerido = 0;

        if (producto.tipo_ganancia === 'fijo') {
            const ganancia = parseFloat(producto.ganancia_fija) || 0;
            precio_sugerido = (base_ieps + ganancia) * (1.0 + iva);
        } else {
             const utilidad = parseFloat(producto.porcentaje_utilidad) || 0;
             precio_sugerido = base_ieps * (1.0 + (utilidad / 100.0)) * (1.0 + iva);
        }
        
        // Update price 1 if it differs significantly (avoid loops via simple epsilon or check)
        // Only update if user hasn't manually overridden? For packages, let's enforce it for now.
        setProducto(prev => ({ ...prev, precio_1: parseFloat(precio_sugerido.toFixed(2)) }));
    }

  }, [producto.costo, producto.porcentaje_utilidad, producto.tipo_ganancia, producto.ganancia_fija, producto.es_paquete]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await getSubfamilias();
        setSubfamilias(res.data);
      } catch (error) {
        console.error("Error al cargar subfamilias", error);
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (selectedProducto) {
      setProducto({
        ...selectedProducto,
        subfamilia_id: selectedProducto.subfamilia ? selectedProducto.subfamilia.id : '',
        venta_granel: selectedProducto.tipo_venta === 'GRANEL',
        precio_1: selectedProducto.precio_1 || 0,
        precio_2: selectedProducto.precio_2 || 0,
        precio_3: selectedProducto.precio_3 || 0,
        precio_4: selectedProducto.precio_4 || 0,
        precio_5: selectedProducto.precio_5 || 0,
        precio_6: selectedProducto.precio_6 || 0,
        clave_sat_unidad: selectedProducto.clave_sat_unidad || 'H87',
        clave_sat_producto: selectedProducto.clave_sat_producto || '01010101',
        numero_identificacion: selectedProducto.numero_identificacion || '',
        objeto_impuesto: selectedProducto.objeto_impuesto || '02',
        es_paquete: selectedProducto.es_paquete || false,
        tipo_ganancia: selectedProducto.tipo_ganancia || 'porcentaje',
        ganancia_fija: selectedProducto.ganancia_fija || 0.00,
        componentes: selectedProducto.componentes ? selectedProducto.componentes.map(c => ({
          componente: c.componente,
          cantidad: c.cantidad,
          nombre: c.componente_nombre // Helper para mostrar nomb
        })) : [],
      });
      if (selectedProducto.imagen) {
        setImagePreview(selectedProducto.imagen);
      } else {
        setImagePreview(null);
      }
    } else {
      setProducto(initialState);
      setImagePreview(null);
    }
  }, [selectedProducto]);

  // Recálculo automático de precios sugeridos al cambiar costo o utilidad
  // Removed old useEffect to avoid conflicts
  /*
  useEffect(() => {
    const costo = parseFloat(producto.costo) || 0;
    const utilidad = parseFloat(producto.porcentaje_utilidad) || 0;
    // ...
  }, [producto.costo, producto.porcentaje_utilidad]);
  */ 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProducto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProducto(prev => ({ ...prev, imagen_file: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Logic for Components
  const filteredCatalog = catalog.filter(p =>
    p.descripcion.toLowerCase().includes(compSearch.toLowerCase()) ||
    p.codigo_barras.includes(compSearch)
  ).slice(0, 5);

  const addComponent = (prodToAdd) => {
    if (producto.componentes.find(c => c.componente === prodToAdd.id)) return;
    setProducto(prev => ({
      ...prev,
      componentes: [...prev.componentes, { componente: prodToAdd.id, cantidad: 1, nombre: prodToAdd.descripcion }]
    }));
    setCompSearch('');
  };

  const updateComponentQty = (index, newQty) => {
    const newComps = [...producto.componentes];
    newComps[index].cantidad = newQty;
    setProducto(prev => ({ ...prev, componentes: newComps }));
  };

  const removeComponent = (index) => {
    setProducto(prev => ({
      ...prev,
      componentes: prev.componentes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...producto };

    if (dataToSave.venta_granel) {
      dataToSave.tipo_venta = 'GRANEL';
    } else {
      dataToSave.tipo_venta = 'UNIDAD';
    }

    // Parse numerics safely
    dataToSave.costo = parseFloat(dataToSave.costo) || 0;
    dataToSave.stock_actual = parseFloat(dataToSave.stock_actual) || 0;
    dataToSave.porcentaje_utilidad = parseFloat(dataToSave.porcentaje_utilidad) || 0;
    dataToSave.tasa_iva = parseFloat(dataToSave.tasa_iva);
    if (isNaN(dataToSave.tasa_iva)) dataToSave.tasa_iva = 0.16;

    dataToSave.tasa_ieps = parseFloat(dataToSave.tasa_ieps) || 0.0;
    dataToSave.ganancia_fija = parseFloat(dataToSave.ganancia_fija) || 0.0; // Parse ganancia fija

    // Parse prices
    [1, 2, 3, 4, 5, 6].forEach(n => {
      dataToSave[`precio_${n}`] = parseFloat(dataToSave[`precio_${n}`]) || 0;
    });

    if (dataToSave.subfamilia_id === '') dataToSave.subfamilia_id = null;

    // Remove components if not package
    if (!dataToSave.es_paquete) {
      dataToSave.componentes = [];
    }

    // Remove image_file if strictly using JSON for now to avoid weird serialization
    // user has been warned image upload needs FormData TODO
    delete dataToSave.imagen_file;

    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Modal Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Complete la información del inventario y facturación.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50 p-8">

          <div className="grid grid-cols-12 gap-8">

            {/* LEFT COLUMN: General Info, Kit Info, Financials */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

              {/* Section: Basic Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">📦</span>
                  Información General
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                    <input
                      name="codigo_barras"
                      value={producto.codigo_barras}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm transition-all"
                      placeholder="Escanee o escriba..."
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      name="stock_actual"
                      value={producto.stock_actual}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                      disabled={!!selectedProducto || producto.es_paquete}
                      title={producto.es_paquete ? "El stock de paquetes se calcula en base a sus componentes" : ""}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Producto</label>
                    <input
                      name="descripcion"
                      value={producto.descripcion}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                      placeholder="Ej. Coca Cola 600ml"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría / Familia</label>
                    <select
                      name="subfamilia_id"
                      value={producto.subfamilia_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="">-- Seleccionar --</option>
                      {subfamilias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Medida</label>
                    <select
                      name="clave_sat_unidad"
                      value={producto.clave_sat_unidad}
                      onChange={handleChange}
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="H87">H87 - Pieza</option>
                      <option value="KGM">KGM - Kilogramo</option>
                      <option value="E48">E48 - Unidad Servicio</option>
                      <option value="XBX">XBX - Caja</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="venta_granel" checked={producto.venta_granel} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Venta a Granel</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="requiere_caducidad" checked={producto.requiere_caducidad} onChange={handleChange} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <span className="ml-2 text-sm text-gray-700">Controlar Caducidad</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="es_paquete" checked={producto.es_paquete} onChange={handleChange} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="ml-2 text-sm text-gray-700 font-bold text-purple-700">Es Paquete/Kit</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="permite_descuento" checked={producto.permite_descuento} onChange={handleChange} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-sm text-gray-700">Permite Descuentos</span>
                  </label>
                </div>

                {/* Expiration Date Input (Conditional) */}
                {producto.requiere_caducidad && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 animate-fade-in-down">
                    <label className="block text-sm font-medium text-red-700 mb-1">Fecha de Caducidad (Referencia Inicial)</label>
                    <input
                      type="date"
                      name="fecha_caducidad"
                      value={producto.fecha_caducidad || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border-red-200 focus:border-red-500 focus:ring-red-200"
                    />
                    <p className="text-xs text-red-500 mt-1">Este dato es referencial. Las caducidades reales se gestionan por lotes en Entradas de Stock.</p>
                  </div>
                )}
              </div>

              {/* Section: Kit Info (Condicional) */}
              {producto.es_paquete && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-2 ring-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-200 text-blue-700 p-1.5 rounded-lg text-sm">🥡</span>
                    Configuración del Paquete
                  </h3>
                  
                  {/* Configuración de Costos y Ganancias del Paquete */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg">
                      <div>
                          <label className="block text-xs font-bold text-blue-900 mb-1">Costo CALCULADO (Componentes):</label>
                          <span className="text-2xl font-bold text-gray-800">${parseFloat(producto.costo).toFixed(2)}</span>
                          <p className="text-[10px] text-blue-600">Suma del costo de componentes agregados.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div>
                           <label className="block text-xs font-bold text-blue-900 mb-1">Tipo de Ganancia</label>
                           <select 
                             name="tipo_ganancia" 
                             value={producto.tipo_ganancia} 
                             onChange={handleChange}
                             className="w-full text-sm rounded border-blue-200 focus:ring-blue-500"
                           >
                              <option value="porcentaje">Porcentaje de Utilidad (%)</option>
                              <option value="fijo">Monto Fijo ($)</option>
                           </select>
                        </div>
                        <div>
                           {producto.tipo_ganancia === 'porcentaje' ? (
                               <>
                                   <label className="block text-xs font-bold text-blue-900 mb-1">% Utilidad</label>
                                   <input 
                                     type="number" 
                                     name="porcentaje_utilidad" 
                                     value={producto.porcentaje_utilidad} 
                                     onChange={handleChange}
                                     className="w-full text-sm rounded border-blue-200"
                                   />
                               </>
                           ) : (
                               <>
                                   <label className="block text-xs font-bold text-blue-900 mb-1">$ Ganancia Fija</label>
                                   <input 
                                     type="number" 
                                     name="ganancia_fija" 
                                     value={producto.ganancia_fija} 
                                     onChange={handleChange}
                                     className="w-full text-sm rounded border-blue-200"
                                   />
                               </>
                           )}
                        </div>
                      </div>
                  </div>

                  <div className="mb-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto para agregar:</label>
                    <input
                      value={compSearch}
                      onChange={e => setCompSearch(e.target.value)}
                      placeholder="Escriba nombre o código..."
                      className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                    />
                    {compSearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl max-h-48 overflow-y-auto">
                        {filteredCatalog.map(p => (
                          <div key={p.id} onClick={() => addComponent(p)} className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                            {p.descripcion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {producto.componentes.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No hay componentes agregados.</p>}
                    {producto.componentes.map((comp, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700 w-1/2 truncate">{comp.nombre || 'Producto ' + comp.componente}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={comp.cantidad}
                            onChange={e => updateComponentQty(idx, e.target.value)}
                            className="w-16 h-8 text-center border-gray-300 rounded text-sm"
                          />
                          <button type="button" onClick={() => removeComponent(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Financials (Costs & Prices) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 p-1.5 rounded-lg text-sm">💲</span>
                  Costos y Precios
                </h3>

                {/* Cost Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Costo Neto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number" step="0.01"
                        name="costo"
                        value={producto.costo}
                        onChange={handleChange}
                        className="w-full pl-7 rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500 text-sm font-semibold text-gray-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">IVA %</label>
                    <select name="tasa_iva" value={producto.tasa_iva} onChange={handleChange} className="w-full rounded-md border-gray-300 text-sm">
                      <option value="0.16">16%</option>
                      <option value="0.08">8%</option>
                      <option value="0.00">0%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">IEPS %</label>
                    <input
                      type="number" step="0.01"
                      name="tasa_ieps"
                      value={producto.tasa_ieps}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 text-sm"
                    />
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <span className="text-xs uppercase text-gray-400 font-bold">Costo Final</span>
                    <span className="text-xl font-bold text-green-700">${getCostoNeto()}</span>
                  </div>
                </div>

                {/* Prices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="bg-white border rounded-lg p-3 relative hover:shadow-md transition-shadow group">
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-300 group-hover:text-blue-400">Precio {n}</span>
                      <label className="block text-xs text-gray-500 mb-1">Precio Venta</label>
                      <div className="relative mb-2">
                        <span className="absolute left-2 top-1.5 text-gray-400 text-sm">$</span>
                        <input
                          type="number" step="0.01"
                          name={`precio_${n}`}
                          value={producto[`precio_${n}`]}
                          onChange={handleChange}
                          className="w-full pl-6 py-1 rounded border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Ganancia:</span>
                        <span className={`font-medium ${parseFloat(calculateGanancia(producto[`precio_${n}`], producto.costo)) < 20 ? 'text-red-500' : 'text-green-600'}`}>
                          {calculateGanancia(producto[`precio_${n}`], producto.costo)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Image & SAT */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

              {/* Section: Image */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <h3 className="text-gray-800 font-semibold mb-4 w-full text-left">Imagen</h3>
                <div className="w-48 h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-4 relative group cursor-pointer hover:border-blue-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-4xl">📷</span>
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-sm font-medium">Cambiar</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Haga clic para subir una imagen (JPG, PNG)</p>
              </div>

              {/* Section: SAT Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-gray-400 text-sm">🏛️</span>
                  Detalles SAT
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Clave Prod/Serv</label>
                    <input
                      name="clave_sat_producto"
                      value={producto.clave_sat_producto}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 text-sm"
                      placeholder="01010101"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Clave del catálogo del SAT</p>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Objeto Impuesto</label>
                    <select
                      name="objeto_impuesto"
                      value={producto.objeto_impuesto}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 text-sm"
                    >
                      <option value="01">01 - No objeto de impuesto</option>
                      <option value="02">02 - Sí objeto de impuesto</option>
                      <option value="03">03 - Sí objeto del impuesto y no obligado al desglose</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">No. Identificación</label>
                    <input
                      name="numero_identificacion"
                      value={producto.numero_identificacion}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            Guardar Producto
          </button>
        </div >
      </div >
    </div >
  );
};


// --- Main Component: Product List ---
const ProductoManagement = () => {
  const [productos, setProductos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PACKAGES, PROMOS
  const navigate = useNavigate();

  const fetchProductos = async () => {
    try {
      const response = await getProductos();
      setProductos(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los productos. Verifique la conexión.');
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleSave = async (producto) => {
    try {
      const dataToSend = { ...producto };
      if (dataToSend.subfamilia_id === '') dataToSend.subfamilia_id = null;

      // TODO: Handle FormData for images here if implemented in API

      if (selectedProducto) {
        await updateProducto(selectedProducto.id, dataToSend);
      } else {
        await createProducto(dataToSend);
      }
      setShowForm(false);
      setSelectedProducto(null);
      fetchProductos();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar el producto.';
      setError(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Confirma que desea eliminar este producto?')) {
      try {
        await deleteProducto(id);
        fetchProductos();
      } catch (err) {
        setError('Error al eliminar el producto.');
      }
    }
  };

  const handleEdit = (prod) => {
    setSelectedProducto(prod);
    setShowForm(true);
  };

  const handleNew = () => {
    setSelectedProducto(null);
    setShowForm(true);
  };

  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
      p.codigo_barras.includes(searchText);

    if (!matchesSearch) return false;

    if (activeTab === 'PACKAGES') return p.es_paquete;
    if (activeTab === 'PROMOS') return p.permite_descuento; // Asumiendo que esta es la flag

    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

      {/* FIXED INTERNAL SIDEBAR */}
      <div className="w-64 bg-white shadow-xl z-0 flex flex-col border-r border-gray-100 hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-blue-600 tracking-tight">Inventario</h1>
          <p className="text-xs text-gray-400 mt-1">Gestión de Catálogo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left
                ${activeTab === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span>📦</span> Productos
          </button>
          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left
                ${activeTab === 'PACKAGES' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span>🥡</span> Paquetes
          </button>
          <button
            onClick={() => setActiveTab('PROMOS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-left
                ${activeTab === 'PROMOS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span>🏷️</span> Promociones
          </button>

          <div className="my-2 border-t border-gray-100"></div>

          <button
            onClick={() => navigate('/existencias')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors text-left"
          >
            <span>📋</span> Inventario Físico
          </button>
          <button
            onClick={() => navigate('/ajustes')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors text-left"
          >
            <span>🔧</span> Ajustes
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top Bar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 border-b border-gray-100 z-10">
          <h2 className="text-xl font-bold text-gray-800">Catálogo de Productos</h2>
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Buscar producto..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-64 placeholder-gray-400"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <button
              onClick={handleNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>+</span> Nuevo Producto
            </button>
          </div>
        </header>

        {/* Alert */}
        {error && (
          <div className="m-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm flex justify-between items-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}

        {/* Table Container */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Existencias</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Precio Público</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProductos.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl text-gray-400 shrink-0">
                          {p.imagen ? <img src={p.imagen} className="w-full h-full object-cover rounded-lg" alt="" /> : '📦'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.descripcion}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.codigo_barras}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(p.subfamilia?.familia_nombre) || 'General'}
                      <span className="text-gray-400 mx-1">›</span>
                      {(p.subfamilia?.nombre) || 'General'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                          ${p.stock_actual > 10 ? 'bg-green-100 text-green-800' :
                          p.stock_actual > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {p.stock_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                      ${Number(p.precio_1).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProductos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* FORM MODAL RENDER */}
      {showForm && (
        <ProductoForm
          selectedProducto={selectedProducto}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          catalog={productos}
        />
      )}

    </div>
  );
};

export default ProductoManagement;