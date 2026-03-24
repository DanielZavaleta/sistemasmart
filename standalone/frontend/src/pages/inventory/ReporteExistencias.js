import React, { useState, useEffect } from 'react';
import { getReporteExistencias, exportarInventarioExcel, getMe, createAjusteStock, getAjustesStock } from '../../services/apiService';
import toast from 'react-hot-toast';

const ReporteExistencias = () => {
    const [reporte, setReporte] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [ajustes, setAjustes] = useState([]);
    
    // Estado para los conteos físicos
    const [conteos, setConteos] = useState({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [reporteRes, userRes, ajustesRes] = await Promise.all([
                getReporteExistencias(),
                getMe(),
                getAjustesStock()
            ]);
            
            setReporte(reporteRes.data);
            setCurrentUser(userRes.data);
            setAjustes(ajustesRes.data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar datos.');
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = async () => {
        try {
            const response = await exportarInventarioExcel();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error al exportar:", err);
            toast.error("Error al exportar a Excel.");
        }
    };

    const handleConteoChange = (productoId, value) => {
        setConteos(prev => ({
            ...prev,
            [productoId]: value
        }));
    };

    const handleSaveAjuste = async (producto) => {
        const cantidadNueva = conteos[producto.id];
        if (cantidadNueva === undefined || cantidadNueva === '') {
            toast.error('Ingrese una cantidad válida');
            return;
        }

        try {
            const payload = {
                producto_id: producto.id,
                cantidad_nueva: parseFloat(cantidadNueva),
                notas: 'Ajuste desde Reporte de Existencias'
            };

            await createAjusteStock(payload);
            toast.success('Ajuste guardado correctamente');
            
            // Limpiar input y recargar datos
            setConteos(prev => {
                const newState = { ...prev };
                delete newState[producto.id];
                return newState;
            });
            fetchInitialData();
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar ajuste');
        }
    };

    const isManager = currentUser && (currentUser.is_superuser || currentUser.is_staff || currentUser.groups.some(g => ['Administrador', 'Gerente', 'Manager'].includes(g.name)));

    const productosFiltrados = reporte?.productos.filter(p =>
        p.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
        p.codigo_barras.toLowerCase().includes(filtro.toLowerCase())
    ) || [];

    if (isLoading) return <div className="text-white p-4">Cargando inventario...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="w-full max-w-6xl p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Existencias e Inventario Físico</h2>
                <div className="flex gap-2">
                    {isManager && (
                         <button
                            onClick={handleExportExcel}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel
                        </button>
                    )}
                   
                    <button
                        onClick={handlePrint}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Resumen - Solo para Managers */}
            {isManager && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500 shadow-lg">
                        <p className="text-gray-400 text-sm uppercase tracking-wider">Valor Total del Inventario</p>
                        <p className="text-4xl font-bold text-white mt-2">
                            ${reporte.valor_total_inventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Costo * Stock Actual</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-cyan-500 shadow-lg">
                        <p className="text-gray-400 text-sm uppercase tracking-wider">Total de Productos</p>
                        <p className="text-4xl font-bold text-white mt-2">{reporte.total_productos}</p>
                        <p className="text-xs text-gray-500 mt-1">Items registrados en catálogo</p>
                    </div>
                </div>
            )}

            {/* Filtro */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por código o descripción..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 outline-none"
                />
            </div>

            {/* Tabla Principal */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-400">
                        <thead className="bg-gray-900 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Código</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4">Familia</th>
                                {isManager && <th className="p-4 text-center">Stock Actual</th>}
                                {isManager && <th className="p-4 text-right">Costo Unit.</th>}
                                {isManager && <th className="p-4 text-right">Valor Total</th>}
                                <th className="p-4 text-center bg-gray-700 text-white">Conteo Físico</th>
                                <th className="p-4">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {productosFiltrados.map((prod) => (
                                <tr key={prod.id} className="hover:bg-gray-700 transition-colors">
                                    <td className="p-4 font-mono text-sm text-cyan-400">{prod.codigo_barras}</td>
                                    <td className="p-4 text-white">{prod.descripcion}</td>
                                    <td className="p-4 text-sm">{prod.familia}</td>
                                    {isManager && (
                                        <td className={`p-4 text-center font-bold ${prod.stock_actual <= 0 ? 'text-red-500' : 'text-white'}`}>
                                            {prod.stock_actual}
                                        </td>
                                    )}
                                    {isManager && <td className="p-4 text-right text-sm">${prod.costo}</td>}
                                    {isManager && (
                                        <td className="p-4 text-right font-bold text-green-400">
                                            ${prod.valor_stock.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                    <td className="p-4 text-center bg-gray-750">
                                        <input
                                            type="number"
                                            className="w-24 p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-cyan-500 text-center"
                                            placeholder="#"
                                            value={conteos[prod.id] !== undefined ? conteos[prod.id] : ''}
                                            onChange={(e) => handleConteoChange(prod.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveAjuste(prod);
                                                }
                                            }}
                                        />
                                    </td>
                                    <td>
                                         <button
                                            onClick={() => handleSaveAjuste(prod)}
                                            className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded"
                                            title="Guardar Ajuste"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {productosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">No se encontraron productos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historial de Ajustes */}
            {isManager && (
                <div className="mt-8">
                     <h3 className="text-xl font-bold text-white mb-4">Historial Reciente de Ajustes</h3>
                     <div className="bg-gray-800 rounded shadow-md overflow-x-auto">
                        <table className="min-w-full text-left text-gray-400">
                        <thead className="bg-gray-900 text-xs uppercase">
                            <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Cant. Anterior</th>
                            <th className="p-4">Cant. Nueva</th>
                            <th className="p-4">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ajustes.map(a => (
                            <tr key={a.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="p-4 text-sm">{new Date(a.fecha).toLocaleString()}</td>
                                <td className="p-4 text-white">{a.producto_nombre}</td>
                                <td className="p-4 text-sm">{a.usuario_username}</td>
                                <td className="p-4 text-sm">{a.cantidad_anterior}</td>
                                <td className="p-4 font-bold text-yellow-400">{a.cantidad_nueva}</td>
                                <td className="p-4 text-sm italic">{a.notas}</td>
                            </tr>
                            ))}
                             {ajustes.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No hay ajustes recientes.</td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ReporteExistencias;
