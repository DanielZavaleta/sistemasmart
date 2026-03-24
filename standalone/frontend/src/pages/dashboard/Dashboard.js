import React from 'react';

const Dashboard = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Ventas</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">$0.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Ordenes</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Clientes</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Proveedores</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
