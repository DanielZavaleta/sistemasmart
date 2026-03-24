import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const PosLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Wrapper */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-[260px]' : 'ml-[80px]'}`}>

                {/* Header */}
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Dynamic Content */}
                <main className="flex-1 p-6 pt-[80px] overflow-x-hidden">
                    {children}
                </main>

                {/* Simple Footer */}
                <footer className="p-4 text-center text-xs text-gray-700">
                    TECH4BISS v1.0 &copy; 2026
                </footer>
            </div>
        </div>
    );
};

export default PosLayout;
