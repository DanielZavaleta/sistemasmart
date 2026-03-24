import React, { useState } from 'react';
import { getReporteVentas } from '../../services/apiService';

const ReporteVentas = () => {
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [reporte, setReporte] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerarReporte = async () => {
        setIsLoading(true);
        setError('');
        setReporte(null);
        try {
            const response = await getReporteVentas(fechaInicio, fechaFin);
            setReporte(response.data);
        } catch (err) {
            console.error(err);
            setError('Error al generar el reporte.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString(['es-MX'], { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString(['es-MX'], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="w-full max-w-7xl p-6 mx-auto printable-receipt">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-bold text-gray-800 tracking-wide">Reporte de Ventas por Período</h2>
                {reporte && (
                    <button
                        onClick={handlePrint}
                        className="bg-gray-700 hover:bg-gray-50 border border-gray-100 text-gray-800 px-5 py-2.5 rounded shadow flex items-center transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        IMPRIMIR
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="bg-white border border-gray-200 shadow-md p-6 rounded-lg shadow-xl mb-8 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="w-full lg:w-1/4">
                        <label className="block text-gray-600 mb-2 text-xs uppercase font-bold">Fecha Inicial</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full p-2.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                    <div className="w-full lg:w-1/4">
                        <label className="block text-gray-600 mb-2 text-xs uppercase font-bold">Fecha Final</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full p-2.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                    {/* Placeholder para filtro de cajeros si se desea implementar más adelante */}
                    <div className="w-full lg:w-1/4">
                        <label className="block text-gray-600 mb-2 text-xs uppercase font-bold">Cajeros</label>
                        <select className="w-full p-2.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-cyan-500 focus:outline-none" disabled>
                            <option>Todos</option>
                        </select>
                    </div>

                    <div className="w-full lg:w-1/4">
                        <button
                            onClick={handleGenerarReporte}
                            disabled={isLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-400 mt-4 bg-red-900/20 p-2 rounded">{error}</p>}
            </div>

            {/* Resultados */}
            {reporte && (
                <div className="space-y-8 animate-fade-in-up">

                    {/* Tabla Detallada por Cajero */}
                    <div className="bg-white border border-gray-200 shadow-md rounded-lg shadow-xl overflow-hidden border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 p-4 bg-gray-50 border-b border-gray-200 flex items-center">
                            <span className="w-2 h-6 bg-cyan-500 mr-2 rounded"></span>
                            Resumen por Cajero
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="p-4 border-b border-gray-200">Nombre Cajero</th>
                                        <th className="p-4 border-b border-gray-200 text-center">Fecha Inicial</th>
                                        <th className="p-4 border-b border-gray-200 text-center">Fecha Final</th>
                                        <th className="p-4 border-b border-gray-200 text-center">Hora Inicial</th>
                                        <th className="p-4 border-b border-gray-200 text-center">Hora Final</th>
                                        <th className="p-4 border-b border-gray-200 text-right">Total Ventas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reporte.ventas_por_cajero && reporte.ventas_por_cajero.length > 0 ? (
                                        reporte.ventas_por_cajero.map((cajero, index) => (
                                            <tr key={index} className="hover:bg-gray-100/50 transition-colors">
                                                <td className="p-4 font-medium text-white">{cajero.nombre_cajero.toUpperCase()}</td>
                                                <td className="p-4 text-center text-gray-700">{formatDate(cajero.fecha_inicial)}</td>
                                                <td className="p-4 text-center text-gray-700">{formatDate(cajero.fecha_final)}</td>
                                                <td className="p-4 text-center text-gray-700 font-mono">{formatTime(cajero.fecha_inicial)}</td>
                                                <td className="p-4 text-center text-gray-700 font-mono">{formatTime(cajero.fecha_final)}</td>
                                                <td className="p-4 text-right font-bold text-cyan-400 text-lg">${cajero.total_ventas.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-700 italic">No se encontraron ventas para este período.</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50/80 font-bold text-gray-800">
                                        <td colSpan="5" className="p-4 text-right uppercase text-xs tracking-wider text-gray-700">Total General</td>
                                        <td className="p-4 text-right text-xl">${reporte.total_periodo.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
};

export default ReporteVentas;
