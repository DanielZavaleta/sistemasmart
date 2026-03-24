import React, { useState, useEffect } from 'react';
import { getGroups, createGroup, updateGroup, deleteGroup, getPermissions } from '../../services/apiService';
import { toast } from 'react-hot-toast';
import { IconTrash, IconPencil, IconPlus, IconX, IconCheck, IconShieldLock } from '@tabler/icons-react';

const MODELOS = [
    { key: 'venta', label: 'Ventas' },
    { key: 'producto', label: 'Productos' },
    { key: 'cliente', label: 'Clientes' },
    { key: 'proveedor', label: 'Proveedores' },
    { key: 'entradastock', label: 'Entradas' },
    { key: 'ajustestock', label: 'Ajustes' },
    { key: 'cortecaja', label: 'Cortes de Caja' },
    { key: 'sucursal', label: 'Sucursales' }
];

const ACCIONES = [
    { key: 'view', label: 'Ver' },
    { key: 'add', label: 'Crear' },
    { key: 'change', label: 'Editar' },
    { key: 'delete', label: 'Borrar' }
];

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        permissions: []
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [rolesRes, permRes] = await Promise.all([getGroups(), getPermissions()]);
            setRoles(rolesRes.data);
            setAvailablePermissions(permRes.data.map(p => p.codename));
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar roles o permisos");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            permissions: role.permissions || []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este Rol?')) {
            try {
                await deleteGroup(id);
                toast.success("Rol eliminado");
                fetchInitialData();
            } catch (error) {
                console.error(error);
                toast.error("Error al eliminar rol");
            }
        }
    };

    const handleCheckboxChange = (codename) => {
        setFormData(prev => {
            const has = prev.permissions.includes(codename);
            const newList = has 
                ? prev.permissions.filter(p => p !== codename) 
                : [...prev.permissions, codename];
            return { ...prev, permissions: newList };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Nombre requerido");

        try {
            if (editingRole) {
                await updateGroup(editingRole.id, formData);
                toast.success("Rol actualizado");
            } else {
                await createGroup(formData);
                toast.success("Rol creado");
            }
            setShowForm(false);
            setEditingRole(null);
            setFormData({ name: '', permissions: [] });
            fetchInitialData();
        } catch (error) {
             console.error(error);
             toast.error("Error al guardar rol");
        }
    };

    if (loading) return <div className="text-gray-800 p-4 font-semibold animate-pulse">Cargando roles...</div>;

    return (
        <div className="p-4 w-full max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                    <IconShieldLock className="mr-2 h-8 w-8 text-cyan-500" />
                    Gestión de Roles y Permisos
                </h2>
                <button 
                    onClick={() => { setShowForm(true); setEditingRole(null); setFormData({ name: '', permissions: [] }); }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded flex items-center shadow-lg transition-transform transform hover:scale-105"
                >
                    <IconPlus className="mr-1" /> Nuevo Rol
                </button>
            </div>

            {showForm && (
                <div className="bg-white border border-gray-200 shadow-md p-6 rounded-lg mb-8 shadow-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                        <h3 className="text-xl font-bold text-gray-800">
                            {editingRole ? `Editar Rol: ${editingRole.name}` : 'Crear Nuevo Rol'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-white">
                            <IconX />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nombre del Rol</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded p-2 outline-none focus:border-cyan-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Administrador, Cajero"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Matriz de Permisos</label>
                            <div className="bg-gray-50 border border-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-gray-700">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="p-3">Módulo</th>
                                            {ACCIONES.map(ac => (
                                                <th key={ac.key} className="p-3 text-center">{ac.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {MODELOS.map(mod => (
                                            <tr key={mod.key} className="hover:bg-gray-100">
                                                <td className="p-3 font-medium text-gray-800">{mod.label}</td>
                                                {ACCIONES.map(ac => {
                                                    const codename = `${ac.key}_${mod.key}`;
                                                    const isAvailable = availablePermissions.includes(codename);
                                                    return (
                                                        <td key={ac.key} className="p-3 text-center">
                                                            {isAvailable ? (
                                                                <input 
                                                                    type="checkbox"
                                                                    className="h-5 w-5 text-cyan-500 rounded border-gray-600 focus:ring-cyan-500 bg-white"
                                                                    checked={formData.permissions.includes(codename)}
                                                                    onChange={() => handleCheckboxChange(codename)}
                                                                />
                                                            ) : (
                                                                <span className="text-gray-600 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center">
                                <IconCheck className="mr-1" /> Guardar
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-50 border border-gray-100 hover:bg-gray-500 text-gray-800 px-4 py-2 rounded">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-gray-200 shadow-md rounded-lg shadow-lg overflow-hidden">
                <table className="w-full text-left text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Nombre del Rol</th>
                            <th className="p-4">Permisos</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {roles.map(r => (
                            <tr key={r.id} className="hover:bg-gray-100 transition-colors">
                                <td className="p-4 text-sm font-mono text-cyan-400">{r.id}</td>
                                <td className="p-4 font-bold text-gray-800">{r.name}</td>
                                <td className="p-4 text-sm">
                                    <div className="flex flex-wrap gap-1">
                                        {r.permissions && r.permissions.slice(0, 3).map(p => (
                                            <span key={p} className="bg-gray-700 text-xs text-cyan-300 px-2 py-0.5 rounded">
                                                {p}
                                            </span>
                                        ))}
                                        {r.permissions?.length > 3 && (
                                            <span className="bg-gray-700 text-xs text-gray-600 px-2 py-0.5 rounded">
                                                +{r.permissions.length - 3} más
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 flex gap-2 justify-center">
                                    <button 
                                        onClick={() => handleEdit(r)}
                                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center shadow"
                                        title="Editar"
                                    >
                                        <IconPencil size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(r.id)}
                                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded flex items-center shadow"
                                        title="Eliminar"
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoleManagement;
