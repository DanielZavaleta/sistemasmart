import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    IconLayoutGrid,
    IconBox,
    IconUser,
    IconSettings,
    IconFileText,
    IconShoppingCart,
    IconUsers,
    IconTruck,
    IconShieldLock
} from '@tabler/icons-react';
import { getMe } from '../../services/apiService';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
             try {
                const res = await getMe();
                setCurrentUser(res.data);
             } catch (err) {
                 console.error("Error fetching user in sidebar:", err);
             }
        };
        fetchUser();
    }, []);

    const hasPermission = (codename) => {
        if (currentUser?.is_superuser) return true;
        return currentUser?.groups?.some(g => g.permissions?.includes(codename));
    };

    // Menu Structure mapping
    const menuItems = [
        {
            title: "Main",
            items: [
                { name: "Dashboard", icon: <IconLayoutGrid size={20} />, path: "/dashboard" },
            ]
        },
        {
            title: "Inventory",
            items: [
                { name: "Productos", icon: <IconBox size={20} />, path: "/productos", permission: 'view_producto' },
                { name: "Entradas / Compras", icon: <IconTruck size={20} />, path: "/entradas", permission: 'view_entradastock' },
                { name: "Categorías", icon: <IconBox size={20} />, path: "/categorias", permission: 'view_categoria' },
                { name: "Existencias", icon: <IconFileText size={20} />, path: "/existencias", permission: 'view_producto' },
                { name: "Transferencias", icon: <IconTruck size={20} />, path: "/transferencias", permission: 'view_transferencia' },
                { name: "Caducidades", icon: <IconFileText size={20} className="text-red-500" />, path: "/caducidades", permission: 'view_entradastockitem' },
            ]
        },
        {
            title: "Sales & Cash",
            items: [
                { name: "Punto de Venta", icon: <IconShoppingCart size={20} />, path: "/pos", permission: 'add_venta' },
                { name: "Historial Ventas", icon: <IconFileText size={20} />, path: "/ventas", permission: 'view_venta' },
                { name: "Corte de Caja", icon: <IconFileText size={20} />, path: "/corte-caja", permission: 'view_cortecaja' },
                { name: "Arqueo de Caja", icon: <IconFileText size={20} />, path: "/arqueo-caja", permission: 'view_cortecaja' },
            ]
        },
        {
            title: "Purchases",
            items: [
                { name: "Órdenes Compra", icon: <IconFileText size={20} />, path: "/ordenes-compra", permission: 'view_ordencompra' },
                { name: "Pagos Prov.", icon: <IconFileText size={20} />, path: "/pagos-proveedores", permission: 'view_pagoproveedor' },
            ]
        },
        {
            title: "Peoples",
            items: [
                { name: "Clientes", icon: <IconUsers size={20} />, path: "/clientes", permission: 'view_cliente' },
                { name: "Proveedores", icon: <IconTruck size={20} />, path: "/proveedores", permission: 'view_proveedor' },
            ]
        },
        {
            title: "Settings",
            items: [
                { name: "Usuarios", icon: <IconUser size={20} />, path: "/usuarios", permission: 'view_user' },
                { name: "Roles", icon: <IconShieldLock size={20} />, path: "/roles", permission: 'change_user' },
                { name: "Mi Perfil", icon: <IconUser size={20} />, path: "/perfil" },
                { name: "Configuración", icon: <IconSettings size={20} />, path: "/configuracion" },
                { name: "Descuentos", icon: <IconFileText size={20} />, path: "/descuentos" },
            ]
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${isOpen ? 'w-[260px]' : 'w-[80px]'}`}>
            {/* Logo */}
            <div className="h-[60px] flex items-center justify-center border-b border-gray-100">
                {isOpen ? (
                    <Link to="/dashboard" className="flex items-center">
                        <img src="./Tech4Biss.png" alt="Logo" className="h-10 object-contain mx-auto" />
                    </Link>
                ) : (
                    <Link to="/dashboard" className="text-2xl font-bold text-primary no-underline">DP</Link>
                )}
            </div>

            {/* User Profile (Mini) */}
            {isOpen && (
                <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                    <img src={currentUser?.avatar || "/assets/img/profiles/avator1.jpg"} alt="User" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    <div>
                        <h6 className="font-bold text-gray-800 text-sm">{currentUser?.username || 'Cargando...'}</h6>
                        <p className="text-xs text-gray-700">{currentUser?.role || 'Usuario'}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="overflow-y-auto h-[calc(100vh-140px)] p-3">
                {menuItems.map((section, idx) => {
                    const filteredItems = section.items.filter(item => {
                        if (!item.permission) return true;
                        return hasPermission(item.permission);
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={idx} className="mb-4">
                            {isOpen && <h6 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 px-3">{section.title}</h6>}
                            <ul>
                                {filteredItems.map((item, i) => (
                                    <li key={i} className="mb-1">
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                                                ${isActive(item.path)
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                            title={!isOpen ? item.name : ''}
                                        >
                                            <span className={`${isActive(item.path) ? 'text-primary' : 'text-gray-700'}`}>{item.icon}</span>
                                            {isOpen && <span>{item.name}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
