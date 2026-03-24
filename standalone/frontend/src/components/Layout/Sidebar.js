import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
    IconLayoutGrid,
    IconBox,
    IconUser,
    IconSettings,
    IconFileText,
    IconShoppingCart,
    IconUsers,
    IconTruck
} from '@tabler/icons-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const [openSubmenu, setOpenSubmenu] = useState({});

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
                { name: "Productos", icon: <IconBox size={20} />, path: "/productos" },
                { name: "Entradas / Compras", icon: <IconTruck size={20} />, path: "/entradas" },
                // { name: "Ajustes Stock", icon: <IconFileText size={20} />, path: "/ajustes" },
                { name: "Categorías", icon: <IconBox size={20} />, path: "/categorias" },
                { name: "Existencias", icon: <IconFileText size={20} />, path: "/existencias" },
                { name: "Transferencias", icon: <IconTruck size={20} />, path: "/transferencias" },
                { name: "Caducidades", icon: <IconFileText size={20} className="text-red-500" />, path: "/caducidades" },
            ]
        },
        {
            title: "Sales & Cash",
            items: [
                { name: "Punto de Venta", icon: <IconShoppingCart size={20} />, path: "/pos" },
                { name: "Historial Ventas", icon: <IconFileText size={20} />, path: "/ventas" },
                { name: "Corte de Caja", icon: <IconFileText size={20} />, path: "/corte-caja" },
                { name: "Arqueo de Caja", icon: <IconFileText size={20} />, path: "/arqueo-caja" },
            ]
        },
        {
            title: "Purchases",
            items: [
                { name: "Órdenes Compra", icon: <IconFileText size={20} />, path: "/ordenes-compra" },
                { name: "Pagos Prov.", icon: <IconFileText size={20} />, path: "/pagos-proveedores" },
            ]
        },
        {
            title: "Peoples",
            items: [
                { name: "Clientes", icon: <IconUsers size={20} />, path: "/clientes" },
                { name: "Proveedores", icon: <IconTruck size={20} />, path: "/proveedores" },
            ]
        },
        {
            title: "Settings",
            items: [
                { name: "Usuarios", icon: <IconUser size={20} />, path: "/usuarios" },
                { name: "Mi Perfil", icon: <IconUser size={20} />, path: "/perfil" }, // Added Profile Link
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
                    <Link to="/dashboard" className="text-2xl font-bold text-primary no-underline hover:text-primary-dark">TECH4BISS</Link>
                ) : (
                    <Link to="/dashboard" className="text-2xl font-bold text-primary no-underline">DP</Link>
                )}
            </div>

            {/* User Profile (Mini) */}
            {isOpen && (
                <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                    <img src="/assets/img/profiles/avator1.jpg" alt="User" className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    <div>
                        <h6 className="font-bold text-gray-800 text-sm">Administrador</h6>
                        <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="overflow-y-auto h-[calc(100vh-140px)] p-3">
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-4">
                        {isOpen && <h6 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2 px-3">{section.title}</h6>}
                        <ul>
                            {section.items.map((item, i) => (
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
                                        <span className={`${isActive(item.path) ? 'text-primary' : 'text-gray-500'}`}>{item.icon}</span>
                                        {isOpen && <span>{item.name}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
