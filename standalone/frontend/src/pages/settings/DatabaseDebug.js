
import React, { useState } from 'react';
import { purgeData } from '../../services/apiService';
import { toast } from 'react-hot-toast';
import { IconTrash, IconAlertTriangle } from '@tabler/icons-react';

const DatabaseDebug = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handlePurge = async () => {
        if (!startDate || !endDate) {
            toast.error("Seleccione un rango de fechas.");
            return;
        }

        if (confirming) {
             setLoading(true);
             try {
                const response = await purgeData({ start_date: startDate, end_date: endDate });
                toast.success(response.data.message || "Depuración completada.");
                setConfirming(false);
                setStartDate('');
                setEndDate('');
             } catch (error) {
                 console.error(error);
                 toast.error("Error al depurar base de datos: " + (error.response?.data?.error || error.message));
             } finally {
                 setLoading(false);
             }
        } else {
            setConfirming(true);
        }
    };

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-8">
            <h3 className="text-xl font-bold text-red-800 flex items-center gap-2 mb-4">
                <IconAlertTriangle size={24} />
                Depuración de Base de Datos
            </h3>
            
            <p className="text-red-700 mb-6 text-sm">
                Esta herramienta elimina <strong>permanentemente</strong> toda la información transaccional (Ventas, Compras, Movimientos) 
                dentro del rango de fechas seleccionado. Los catálogos (Productos, Clientes) NO se eliminan.
                <br/><strong>¡Esta acción es irreversible!</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-red-900 mb-1">Fecha Inicio</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-red-900 mb-1">Fecha Fin</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                {confirming ? (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setConfirming(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handlePurge}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow-lg animate-pulse"
                            disabled={loading}
                        >
                            {loading ? 'Eliminando...' : '¡ESTOY SEGURO, ELIMINAR!'}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handlePurge}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200"
                        disabled={loading}
                    >
                        <IconTrash size={18} />
                        Depurar Información
                    </button>
                )}
            </div>
        </div>
    );
};

export default DatabaseDebug;
