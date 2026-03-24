import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getSucursales } from '../../services/apiService';
import { toast } from 'react-hot-toast';
import { IconTrash, IconPencil, IconPlus, IconX, IconCheck, IconBuildingStore } from '@tabler/icons-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'Vendedor',
        sucursal_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchSucursales();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    const fetchSucursales = async () => {
        try {
            const response = await getSucursales();
            setSucursales(response.data);
        } catch (error) {
            console.error("Error fetching sucursales:", error);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            password: '',
            role: user.role,
            sucursal_id: user.sucursal && user.sucursal !== 'Sin Sucursal' 
                ? sucursales.find(s => s.nombre === user.sucursal)?.id || '' 
                : ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await deleteUser(id);
                toast.success("Usuario eliminado");
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                toast.error("Error al eliminar usuario");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = { ...formData };
            if (!dataToSend.password) delete dataToSend.password;
            if (!dataToSend.sucursal_id) dataToSend.sucursal_id = null;

            if (editingUser) {
                await updateUser(editingUser.id, dataToSend);
                toast.success("Usuario actualizado correctamente");
            } else {
                await createUser(dataToSend);
                toast.success("Usuario creado correctamente");
            }
            setShowForm(false);
            fetchUsers();
            setFormData({ username: '', first_name: '', last_name: '', email: '', password: '', role: 'Vendedor', sucursal_id: '' });
            setEditingUser(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar usuario");
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ username: '', first_name: '', last_name: '', email: '', password: '', role: 'Vendedor', sucursal_id: '' });
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <IconPlus size={20} /> Nuevo Usuario
                    </button>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                                <IconX size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                                    <input 
                                        type="text" 
                                        name="username" 
                                        value={formData.username} 
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select 
                                        name="role" 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Administrador">Administrador</option>
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Almacenista">Almacenista</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input 
                                        type="text" 
                                        name="first_name" 
                                        value={formData.first_name} 
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input 
                                        type="text" 
                                        name="last_name" 
                                        value={formData.last_name} 
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña {editingUser && <span className="text-gray-400 font-normal">(Dejar en blanco para mantener)</span>}
                                </label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    {...(!editingUser ? { required: true } : {})}
                                />
                            </div>

                            {/* Sucursal Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <IconBuildingStore size={16} className="text-gray-500"/> Sucursal Asignada
                                </label>
                                <select 
                                    name="sucursal_id" 
                                    value={formData.sucursal_id} 
                                    onChange={(e) => setFormData({...formData, sucursal_id: e.target.value})}
                                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Sin Sucursal --</option>
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button 
                                    type="button" 
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <IconCheck size={18} /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sucursal</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{user.username}</td>
                                <td className="p-4 text-gray-600">{user.first_name} {user.last_name}</td>
                                <td className="p-4 text-gray-500">{user.email}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                     {user.sucursal && user.sucursal !== 'Sin Sucursal' ? (
                                        <span className="flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-sm">
                                            <IconBuildingStore size={14}/> {user.sucursal}
                                        </span>
                                     ) : (
                                        <span className="text-gray-400 text-sm italic">--</span>
                                     )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(user)} 
                                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <IconPencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.id)} 
                                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <IconTrash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        No hay usuarios registrados.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;