import React from 'react';
import { Link } from 'react-router-dom';
import { IconMenu2, IconSearch, IconBell, IconUser, IconLogout, IconSettings } from '@tabler/icons-react';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    return (
        <header className={`fixed top-0 right-0 h-[60px] bg-white border-b border-gray-200 z-40 transition-all duration-300 flex items-center justify-between px-6 
            ${sidebarOpen ? 'left-[260px] w-[calc(100%-260px)]' : 'left-[80px] w-[calc(100%-80px)]'} 
        `}>

            {/* Left: Sidebar Toggle & Search */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    <IconMenu2 size={24} />
                </button>

                <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200 w-[300px]">
                    <IconSearch size={18} className="text-gray-600 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar productos, clientes..."
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400 focus:ring-0"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">

                {/* POS Shortcut */}
                <Link to="/pos" className="hidden md:flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors no-underline">
                    <img src="/assets/img/icons/cash.svg" alt="" className="w-5 h-5" onError={(e) => e.target.style.display = 'none'} />
                    POS
                </Link>

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <IconBell size={22} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                {/* Logout Button */}
                <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }} 
                    className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    title="Cerrar Sesión"
                >
                    <IconLogout size={22} />
                </button>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-800 leading-tight">Admin</p>
                        <p className="text-[11px] text-gray-700">Super Admin</p>
                    </div>
                    <img
                        src="/assets/img/profiles/avator1.jpg"
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                </div>

            </div>
        </header>
    );
};

export default Header;
