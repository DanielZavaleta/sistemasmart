import React, { useState, useEffect } from 'react';
import { getProveedores, getOrdenesCompra, getPagosProveedores, createPagoProveedor } from '../../services/apiService';

const ProveedorPagos = () => {
    const [pagos, setPagos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [proveedorId, setProveedorId] = useState('');
    const [ordenCompraId, setOrdenCompraId] = useState('');
    const [monto, setMonto] = useState('');
    const [metodo, setMetodo] = useState('efectivo');
    const [referencia, setReferencia] = useState('');
    const [notas, setNotas] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [resPagos, resProv, resOrdenes] = await Promise.all([
                getPagosProveedores(),
                getProveedores(),
                getOrdenesCompra()
            ]);
            setPagos(resPagos.data);
            setProveedores(resProv.data);
            setOrdenes(resOrdenes.data);
        } catch (err) {
            setError('Error al cargar datos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!proveedorId || !monto) {
            setError('Proveedor y Monto son obligatorios.');
            return;
        }

        try {
            await createPagoProveedor({
                proveedor_id: proveedorId,
                orden_compra_id: ordenCompraId || null,
                monto: monto,
                metodo: metodo,
                referencia: referencia,
                notas: notas
            });
            setShowForm(false);
            resetForm();
            fetchData();
        } catch (err) {
            setError('Error al registrar el pago.');
            console.error(err);
        }
    };

    const resetForm = () => {
        setProveedorId('');
        setOrdenCompraId('');
        setMonto('');
        setMetodo('efectivo');
        setReferencia('');
        setNotas('');
    };

    // Filtrar órdenes por proveedor seleccionado
    const ordenesFiltradas = ordenes.filter(o => o.proveedor_id === parseInt(proveedorId));

    return (
        <div className="w-full max-w-6xl p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Pagos a Proveedores</h2>

            {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                    + Registrar Nuevo Pago
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-md p-6 rounded-lg mb-6 text-gray-700">
                    <h3 className="text-xl text-white mb-4">Registrar Pago</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Proveedor *</label>
                            <select
                                value={proveedorId}
                                onChange={e => setProveedorId(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre_comercial}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Orden de Compra (Opcional)</label>
                            <select
                                value={ordenCompraId}
                                onChange={e => setOrdenCompraId(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                                disabled={!proveedorId}
                            >
                                <option value="">-- Ninguna --</option>
                                {ordenesFiltradas.map(o => (
                                    <option key={o.id} value={o.id}>OC-{o.id} (${o.total})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Monto *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={monto}
                                onChange={e => setMonto(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Método de Pago</label>
                            <select
                                value={metodo}
                                onChange={e => setMetodo(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Referencia (Cheque/Transf)</label>
                            <input
                                type="text"
                                value={referencia}
                                onChange={e => setReferencia(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm mb-1">Notas</label>
                            <input
                                type="text"
                                value={notas}
                                onChange={e => setNotas(e.target.value)}
                                className="p-2 bg-gray-700 rounded w-full text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); resetForm(); }}
                            className="bg-gray-50 border border-gray-100 hover:bg-gray-500 text-gray-800 py-2 px-4 rounded"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Guardar Pago
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white border border-gray-200 shadow-md rounded shadow-md overflow-x-auto">
                <h3 className="text-xl text-white p-4">Historial de Pagos</h3>
                {isLoading ? <p className="p-4 text-gray-600">Cargando...</p> : (
                    <table className="min-w-full text-left text-gray-700">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="p-4">ID</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Proveedor</th>
                                <th className="p-4">Monto</th>
                                <th className="p-4">Método</th>
                                <th className="p-4">OC</th>
                                <th className="p-4">Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagos.map(p => (
                                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="p-4">{p.id}</td>
                                    <td className="p-4">{new Date(p.fecha).toLocaleDateString()}</td>
                                    <td className="p-4">{p.proveedor_nombre}</td>
                                    <td className="p-4 font-bold text-green-400">${p.monto}</td>
                                    <td className="p-4 capitalize">{p.metodo}</td>
                                    <td className="p-4">{p.orden_compra ? `OC-${p.orden_compra}` : '-'}</td>
                                    <td className="p-4 text-sm text-gray-700">{p.usuario_username}</td>
                                </tr>
                            ))}
                            {pagos.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-gray-700">No hay pagos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProveedorPagos;
