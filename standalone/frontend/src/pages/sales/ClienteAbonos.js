import React, { useState, useEffect } from 'react';
import { getClientes, getMovimientosCliente, createAbono } from '../../services/apiService';

const ClienteAbonos = () => {
    const [clientes, setClientes] = useState([]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [movimientos, setMovimientos] = useState([]);
    const [saldoActual, setSaldoActual] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Form State
    const [monto, setMonto] = useState('');
    const [notas, setNotas] = useState('');

    useEffect(() => {
        fetchClientes();
    }, []);

    useEffect(() => {
        if (selectedClienteId) {
            fetchMovimientos(selectedClienteId);
        } else {
            setMovimientos([]);
            setSaldoActual(0);
        }
    }, [selectedClienteId]);

    const fetchClientes = async () => {
        try {
            const response = await getClientes();
            setClientes(response.data);
            setIsLoading(false);
        } catch (err) {
            setError('Error al cargar clientes.');
            setIsLoading(false);
        }
    };

    const fetchMovimientos = async (clienteId) => {
        try {
            const filters = {};
            if (fechaInicio) filters.fecha_inicio = fechaInicio;
            if (fechaFin) filters.fecha_fin = fechaFin;

            const response = await getMovimientosCliente(clienteId, filters);
            setMovimientos(response.data);

            const cliente = clientes.find(c => c.id === parseInt(clienteId));
            if (cliente) {
                setSaldoActual(cliente.saldo_actual);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar movimientos.');
        }
    };

    const handleRegistrarAbono = async (e) => {
        e.preventDefault();
        setError('');

        if (!monto || parseFloat(monto) <= 0) {
            setError('El monto debe ser mayor a 0.');
            return;
        }

        try {
            await createAbono({
                cliente_id: selectedClienteId,
                tipo: 'abono',
                monto: monto,
                notas: notas
            });

            setMonto('');
            setNotas('');

            await fetchClientes();
            fetchMovimientos(selectedClienteId);

        } catch (err) {
            setError('Error al registrar el abono.');
            console.error(err);
        }
    };

    const handlePrint = () => {
        if (!selectedClienteId) return;
        const cliente = clientes.find(c => c.id === parseInt(selectedClienteId));

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${cliente.razon_social}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { bg-color: #f2f2f2; }
            .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Estado de Cuenta</h1>
            <p>Fecha de Emisión: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="info">
            <p><strong>Cliente:</strong> ${cliente.razon_social}</p>
            <p><strong>RFC:</strong> ${cliente.rfc}</p>
            <p><strong>Periodo:</strong> ${fechaInicio || 'Inicio'} - ${fechaFin || 'Actualidad'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Referencia/Notas</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${movimientos.map(m => `
                <tr>
                  <td>${new Date(m.fecha).toLocaleDateString()} ${new Date(m.fecha).toLocaleTimeString()}</td>
                  <td>${m.tipo.toUpperCase()}</td>
                  <td>${m.notas || '-'}</td>
                  <td>$${m.monto}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Saldo Pendiente Actual: $${saldoActual}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="w-full max-w-6xl p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Cuentas por Cobrar (Abonos)</h2>

            {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Panel Izquierdo: Selección y Formulario */}
                <div className="bg-white border border-gray-200 shadow-md p-6 rounded-lg shadow-lg">
                    <label className="block text-sm mb-2 text-gray-700">Seleccionar Cliente</label>
                    <select
                        value={selectedClienteId}
                        onChange={e => setSelectedClienteId(e.target.value)}
                        className="p-3 bg-gray-700 rounded w-full text-white mb-6 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="">-- Seleccionar --</option>
                        {clientes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.razon_social} - Deuda: ${c.saldo_actual}
                            </option>
                        ))}
                    </select>

                    {selectedClienteId && (
                        <div className="border-t border-gray-200 pt-4">
                            <div className="mb-6 text-center">
                                <p className="text-gray-600">Saldo Actual</p>
                                <p className={`text-4xl font-bold ${saldoActual > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    ${saldoActual}
                                </p>
                            </div>

                            <form onSubmit={handleRegistrarAbono}>
                                <h3 className="text-xl text-white mb-4">Registrar Abono</h3>

                                <div className="mb-4">
                                    <label className="block text-sm mb-1 text-gray-700">Monto *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        className="p-2 bg-gray-700 rounded w-full text-white"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm mb-1 text-gray-700">Notas</label>
                                    <input
                                        type="text"
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                        className="p-2 bg-gray-700 rounded w-full text-white"
                                        placeholder="Ej. Transferencia, Efectivo..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                                >
                                    Registrar Pago
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Historial */}
                <div className="md:col-span-2 bg-white border border-gray-200 shadow-md p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl text-white">Historial de Movimientos</h3>
                        {selectedClienteId && (
                            <button
                                onClick={handlePrint}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Imprimir
                            </button>
                        )}
                    </div>

                    {selectedClienteId && (
                        <div className="flex gap-4 mb-4 bg-gray-700 p-3 rounded">
                            <div>
                                <label className="block text-xs text-gray-600">Desde</label>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={e => setFechaInicio(e.target.value)}
                                    className="bg-gray-50 border border-gray-100 text-gray-800 p-1 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600">Hasta</label>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={e => setFechaFin(e.target.value)}
                                    className="bg-gray-50 border border-gray-100 text-gray-800 p-1 rounded"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => fetchMovimientos(selectedClienteId)}
                                    className="bg-gray-500 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
                                >
                                    Filtrar
                                </button>
                            </div>
                        </div>
                    )}

                    {!selectedClienteId ? (
                        <p className="text-gray-700">Seleccione un cliente para ver su historial.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-gray-700">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Monto</th>
                                        <th className="p-3">Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movimientos.map(m => (
                                        <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="p-3">{m.id}</td>
                                            <td className="p-3">{new Date(m.fecha).toLocaleDateString()} {new Date(m.fecha).toLocaleTimeString()}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${m.tipo === 'cargo' ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                                                    {m.tipo.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-white">${m.monto}</td>
                                            <td className="p-3 text-sm text-gray-600">{m.notas}</td>
                                        </tr>
                                    ))}
                                    {movimientos.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-4 text-center text-gray-700">No hay movimientos en este periodo.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ClienteAbonos;
