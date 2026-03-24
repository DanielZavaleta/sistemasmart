import React, { useState, useEffect } from 'react';
import { getConfig, updateConfig, createConfig } from '../../services/apiService';
import { toast } from 'react-hot-toast';
import DatabaseDebug from './DatabaseDebug';

const Configuracion = () => {
    const [config, setConfig] = useState({
        nombre_tienda: '',
        direccion: '',
        telefono: '',
        rfc: '',
        mensaje_ticket: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await getConfig();
            // Backend returns a list (ViewSet standard) or single object if modified logic?
            // Our ViewSet logic returns list but creates one if empty.
            // But if we call detail endpoint vs list...
            // Let's assume list for now as ViewSet defaults to list at /configuracion/
            if (Array.isArray(response.data)) {
                if (response.data.length > 0) {
                    setConfig(response.data[0]);
                }
            } else {
                setConfig(response.data);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar la configuración');
            setLoading(false);
        }
    };

    const [logoFile, setLogoFile] = useState(null);

    const handleChange = (e) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        // Append all text fields
        Object.keys(config).forEach(key => {
            if (key !== 'logo' && config[key] !== null && config[key] !== undefined) {
                formData.append(key, config[key]);
            }
        });
        
        // Append file if exists
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            if (config.id) {
                // For update with files, we use PUT or PATCH. Axios with FormData automatically sets Content-Type multipart/form-data
                await updateConfig(config.id, formData);
            } else {
                await createConfig(formData);
            }
            toast.success('Configuración guardada exitosamente');
            // Small delay to allow backend to process image
            setTimeout(fetchConfig, 500);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar la configuración');
        }
    };

    if (loading) return <div className="p-8">Cargando...</div>;

    return (
        <div className="w-full max-w-4xl p-6 mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración del Sistema</h2>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Información General</h3>
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Tienda</label>
                                <input
                                    type="text"
                                    name="nombre_tienda"
                                    value={config.nombre_tienda}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">RFC</label>
                                <input
                                    type="text"
                                    name="rfc"
                                    value={config.rfc || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={config.telefono || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                            <textarea
                                name="direccion"
                                value={config.direccion || ''}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Ticket Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Personalización del Ticket</h3>
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo del Ticket</label>
                                <div className="flex items-center gap-4">
                                    {config.logo && (
                                        <div className="w-20 h-20 border border-gray-200 rounded p-1 flex items-center justify-center bg-gray-50">
                                            <img src={config.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="logo"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Font Size */}
                            <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de Fuente (px)</label>
                                 <input
                                    type="number"
                                    name="ticket_font_size"
                                    value={config.ticket_font_size || 12}
                                    onChange={handleChange}
                                    min="8"
                                    max="24"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado Personalizado</label>
                                <textarea
                                    name="encabezado_personalizado"
                                    value={config.encabezado_personalizado || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Texto adicional al inicio..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pie de Página</label>
                                <textarea
                                    name="mensaje_ticket"
                                    value={config.mensaje_ticket || ''}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="¡Gracias por su compra!"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg flex items-center gap-2"
                    >
                        <span>💾</span> Guardar Toda la Configuración
                    </button>
                </div>
            </form>

            <DatabaseDebug />
        </div>
    );
};

export default Configuracion;
