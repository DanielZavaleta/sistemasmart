import React, { useState, useEffect } from 'react';
import { getDescuentos, createDescuento, deleteDescuento } from '../../services/apiService';
import { TrashIcon, PlusIcon } from '../../components/shared/Icons';

const ConfigurarDescuentos = () => {
    const [descuentos, setDescuentos] = useState([]);
    const [newPorcentaje, setNewPorcentaje] = useState('');
    const [newDescripcion, setNewDescripcion] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDescuentos();
    }, []);

    const fetchDescuentos = async () => {
        setLoading(true);
        try {
            const res = await getDescuentos();
            setDescuentos(res.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar descuentos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createDescuento({
                porcentaje: newPorcentaje,
                descripcion: newDescripcion
            });
            setNewPorcentaje('');
            setNewDescripcion('');
            fetchDescuentos();
        } catch (err) {
            setError('Error al crear descuento.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro de eliminar este descuento?')) return;
        try {
            await deleteDescuento(id);
            fetchDescuentos();
        } catch (err) {
            setError('Error al eliminar descuento.');
            console.error(err);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen text-gray-800">
            <h1 className="text-3xl font-bold mb-6 text-cyan-400">Configuración de Descuentos</h1>

            <div className="flex gap-6">
                {/* Formulario de Creación */}
                <div className="w-1/3 bg-white border border-gray-200 shadow-md p-6 rounded-lg shadow-lg h-fit">
                    <h2 className="text-xl font-bold mb-4">Agregar Nuevo Nivel</h2>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-2">Porcentaje (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={newPorcentaje}
                                onChange={(e) => setNewPorcentaje(e.target.value)}
                                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:border-cyan-500 border border-gray-600"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-2">Descripción (Opcional)</label>
                            <input
                                type="text"
                                value={newDescripcion}
                                onChange={(e) => setNewDescripcion(e.target.value)}
                                placeholder="Ej. Cliente VIP"
                                className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:border-cyan-500 border border-gray-600"
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2">
                            <PlusIcon /> Agregar
                        </button>
                    </form>
                </div>

                {/* Lista de Descuentos */}
                <div className="w-2/3">
                    {loading ? (
                        <p>Cargando...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {descuentos.map(d => (
                                <div key={d.id} className="bg-white border border-gray-200 shadow-md p-4 rounded border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <p className="text-2xl font-bold text-cyan-400">{d.porcentaje}%</p>
                                        {d.descripcion && <p className="text-gray-600 text-sm">{d.descripcion}</p>}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(d.id)}
                                        className="text-red-500 hover:text-red-400"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                            {descuentos.length === 0 && <p className="text-gray-700 col-span-full">No hay descuentos configurados.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfigurarDescuentos;
