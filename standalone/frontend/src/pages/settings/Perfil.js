import React, { useState, useEffect } from 'react';
import { getUser, updateProfile } from '../../services/apiService';
import { toast } from 'react-hot-toast';
import { IconUser, IconLock, IconCamera, IconDeviceFloppy } from '@tabler/icons-react';

const Perfil = () => {
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser && storedUser.user_id) {
            setUserId(storedUser.user_id);
            fetchUserDetails(storedUser.user_id);
        } else {
            console.error("No user found in localStorage");
            setLoading(false);
        }
    }, []);

    const fetchUserDetails = async (id) => {
        try {
            const response = await getUser(id);
            const user = response.data;
            setFormData({
                username: user.username,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                password: '',
                confirmPassword: ''
            });
            if (user.avatar) {
                setCurrentAvatarUrl(user.avatar);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("Error al cargar los datos del usuario.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        const data = new FormData();
        data.append('first_name', formData.first_name);
        data.append('last_name', formData.last_name);
        data.append('email', formData.email);
        
        if (formData.password) {
            data.append('password', formData.password);
        }

        if (avatarFile) {
            data.append('avatar', avatarFile);
        }

        try {
            const response = await updateProfile(userId, data);
            toast.success("Perfil actualizado exitosamente");
            setCurrentAvatarUrl(response.data.avatar); // Update current avatar from response
            setAvatarFile(null);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            
            // Optionally update localStorage if fundamental data changed (like name)
             const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
             localStorage.setItem('user', JSON.stringify({
                 ...storedUser,
                 // Update specific fields if they are stored there. Usually only basic info is stored.
             }));

        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <IconUser size={28} /> Mi Perfil
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : currentAvatarUrl ? (
                                    <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <IconUser size={64} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                                <IconCamera size={20} />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                />
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Click en la cámara para cambiar imagen</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (No editable)</label>
                        <input
                            type="text"
                            value={formData.username}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <IconLock size={16} /> Cambiar Contraseña <span className="text-gray-400 font-normal">(Opcional)</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                        >
                            <IconDeviceFloppy size={20} /> Guardar Cambios
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Perfil;
