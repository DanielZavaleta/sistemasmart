import React, { useState, useEffect } from 'react';
import { getClientes } from '../../services/apiService';
import { IconSearch, IconUser, IconX, IconCheck } from '@tabler/icons-react';

const ClientSearchModal = ({ onClose, onSelect }) => {
    const [clientes, setClientes] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [term, setTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        setLoading(true);
        try {
            const res = await getClientes();
            setClientes(res.data);
            setFiltered(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!term) {
            setFiltered(clientes);
            return;
        }
        const lower = term.toLowerCase();
        setFiltered(clientes.filter(c =>
            c.razon_social.toLowerCase().includes(lower) ||
            c.rfc.toLowerCase().includes(lower) ||
            (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(lower))
        ));
    }, [term, clientes]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">

                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <IconUser /> Buscar Cliente
                    </h3>
                    <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full text-gray-500"><IconX size={20} /></button>
                </div>

                <div className="p-4 border-b">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            className="w-full pl-10 p-3 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none"
                            placeholder="Buscar por nombre, RFC..."
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Cargando clientes...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No se encontraron clientes</div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(c => (
                                <div key={c.id}
                                    onClick={() => { onSelect(c); onClose(); }}
                                    className="p-3 hover:bg-blue-50 cursor-pointer rounded-xl border border-transparent hover:border-blue-100 transition-all group flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{c.razon_social}</p>
                                        <p className="text-sm text-gray-500">{c.rfc} {c.nombre_comercial ? ` - ${c.nombre_comercial}` : ''}</p>
                                        {c.limite_credito > 0 && (
                                            <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                Crédito: ${c.limite_credito}
                                            </span>
                                        )}
                                    </div>
                                    <IconCheck className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ClientSearchModal;
