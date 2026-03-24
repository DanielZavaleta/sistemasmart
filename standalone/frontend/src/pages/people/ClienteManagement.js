import React, { useState, useEffect } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente, getDescuentos } from '../../services/apiService';



const ClienteForm = ({ selectedCliente, onSave, onCancel }) => {
    const initialState = {
        rfc: '',
        razon_social: '',
        nombre_comercial: '',
        email: '',
        telefono: '',
        telefono: '',
        direccion: '',
        limite_credito: 0.00,

        descuento_id: '',
    };
    const [cliente, setCliente] = useState(initialState);
    const [descuentos, setDescuentos] = useState([]);

    useEffect(() => {
        getDescuentos().then(res => setDescuentos(res.data)).catch(err => console.error(err));
    }, []);


    useEffect(() => {
        if (selectedCliente) {
            setCliente({
                ...selectedCliente,
                descuento_id: selectedCliente.descuento_data ? selectedCliente.descuento_data.id : (selectedCliente.descuento_id || ''),
            });

        } else {
            setCliente(initialState);
        }
    }, [selectedCliente]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCliente(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(cliente);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-md p-4 rounded mb-4">
            <h3 className="text-xl text-white mb-4">{selectedCliente ? 'Editar' : 'Crear'} Cliente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="rfc" value={cliente.rfc} onChange={handleChange} placeholder="RFC (13 caracteres)" className="p-2 bg-gray-700 rounded" required maxLength="13" />
                <input name="razon_social" value={cliente.razon_social} onChange={handleChange} placeholder="Razón Social (Nombre Fiscal)" className="p-2 bg-gray-700 rounded" required />
                <input name="nombre_comercial" value={cliente.nombre_comercial} onChange={handleChange} placeholder="Nombre Comercial (Opcional)" className="p-2 bg-gray-700 rounded" />
                <input name="email" value={cliente.email} onChange={handleChange} placeholder="Email (Opcional)" type="email" className="p-2 bg-gray-700 rounded" />
                <input name="telefono" value={cliente.telefono} onChange={handleChange} placeholder="Teléfono (Opcional)" className="p-2 bg-gray-700 rounded" />
                <div className="flex flex-col">
                    <label className="text-gray-600 text-xs mb-1">Límite de Crédito</label>
                    <input type="number" step="0.01" name="limite_credito" value={cliente.limite_credito} onChange={handleChange} className="p-2 bg-gray-700 rounded" />
                </div>
                <textarea name="direccion" value={cliente.direccion} onChange={handleChange} placeholder="Dirección Fiscal (Calle, No, Col, Ciudad)" className="p-2 bg-gray-700 rounded md:col-span-2" rows="2"></textarea>


                {/* Campos Fiscales SAT */}
                <input name="cp_fiscal" value={cliente.cp_fiscal || ''} onChange={handleChange} placeholder="C.P. Fiscal (Lugar Expedición)" className="p-2 bg-gray-700 rounded" maxLength="5" />

                <select name="regimen_fiscal" value={cliente.regimen_fiscal || ''} onChange={handleChange} className="p-2 bg-gray-700 rounded">
                    <option value="">-- Regimen Fiscal --</option>
                    <option value="601">601 - General de Ley Personas Morales</option>
                    <option value="616">616 - Sin obligaciones fiscales</option>
                    <option value="626">626 - Régimen Simplificado de Confianza</option>
                    <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                    {/* Add more as necessary */}
                </select>

                <select name="uso_cfdi" value={cliente.uso_cfdi || ''} onChange={handleChange} className="p-2 bg-gray-700 rounded">
                    <option value="">-- Uso CFDI --</option>
                    <option value="G01">G01 - Adquisición de mercancías</option>
                    <option value="G03">G03 - Gastos en general</option>
                    <option value="S01">S01 - Sin efectos fiscales</option>
                    <option value="CP01">CP01 - Pagos</option>
                </select>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-xs mb-1">Descuento Automático</label>
                    <select name="descuento_id" value={cliente.descuento_id || ''} onChange={handleChange} className="p-2 bg-gray-700 rounded">
                        <option value="">-- Ninguno --</option>
                        {descuentos.map(d => (
                            <option key={d.id} value={d.id}>{d.porcentaje}% - {d.descripcion}</option>
                        ))}
                    </select>
                </div>
            </div>


            <div className="mt-6">
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mr-2">Guardar</button>
                <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
            </div>
        </form>
    );
};

const ClienteManagement = () => {
    const [clientes, setClientes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [error, setError] = useState(null);

    const fetchClientes = async () => {
        try {
            const response = await getClientes();
            setClientes(response.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar clientes.');
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    const handleSave = async (cliente) => {
        try {
            if (selectedCliente) {
                await updateCliente(selectedCliente.id, cliente);
            } else {
                await createCliente(cliente);
            }
            setShowForm(false);
            setSelectedCliente(null);
            fetchClientes();
        } catch (err) {
            setError('Error al guardar el cliente.');
        }
    };

    const handleEdit = (cliente) => {
        setSelectedCliente(cliente);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                await deleteCliente(id);
                fetchClientes();
            } catch (err) {
                setError('Error al eliminar el cliente.');
            }
        }
    };

    return (
        <div className="w-full max-w-6xl p-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Gestión de Clientes</h2>
            {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

            {!showForm ? (
                <button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
                    + Nuevo Cliente
                </button>
            ) : (
                <ClienteForm selectedCliente={selectedCliente} onSave={handleSave} onCancel={() => { setShowForm(false); setSelectedCliente(null); }} />
            )}

            <div className="bg-white border border-gray-200 shadow-md rounded shadow-md overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="p-4">RFC</th>
                            <th className="p-4">Razón Social</th>
                            <th className="p-4">Nombre Comercial</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Teléfono</th>
                            <th className="p-4">Descuento</th>
                            <th className="p-4">Acciones</th>

                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map(c => (
                            <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="p-4">{c.rfc}</td>
                                <td className="p-4">{c.razon_social}</td>
                                <td className="p-4">{c.nombre_comercial}</td>
                                <td className="p-4">{c.email}</td>
                                <td className="p-4">{c.email}</td>
                                <td className="p-4">{c.telefono}</td>
                                <td className="p-4">
                                    {c.descuento_data ? (
                                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                            {c.descuento_data.porcentaje}% ({c.descuento_data.descripcion})
                                        </span>
                                    ) : '-'}
                                </td>

                                <td className="p-4">
                                    <button onClick={() => handleEdit(c)} className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm font-bold py-1 px-2 rounded mr-2">Editar</button>
                                    <button onClick={() => handleDelete(c.id)} className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-2 rounded">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClienteManagement;