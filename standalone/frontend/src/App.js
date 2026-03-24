import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Login
import LoginForm from './components/auth/LoginForm';

// Layout
import PosLayout from './components/Layout/PosLayout';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import PosView from './pages/pos/PosView';

// Inventory
import ProductoManagement from './pages/inventory/ProductoManagement';
import CategoriaManagement from './pages/inventory/CategoriaManagement';
import EntradaStock from './pages/inventory/EntradaStock';
// import AjusteStock from './pages/inventory/AjusteStock';
import CaducidadReport from './pages/inventory/CaducidadReport';
import Configuracion from './pages/settings/Configuracion';
import Perfil from './pages/settings/Perfil'; // Import Perfil
import ConfigurarDescuentos from './pages/settings/ConfigurarDescuentos';

import ReporteExistencias from './pages/inventory/ReporteExistencias';
import TransferenciaForm from './pages/transferencias/TransferenciaForm';

// People
import ClienteManagement from './pages/people/ClienteManagement';
import ProveedorManagement from './pages/people/ProveedorManagement';
import UserManagement from './pages/people/UserManagement';

// Sales & Cash
import ReporteVentas from './pages/sales/ReporteVentas';
import CorteCaja from './pages/sales/CorteCaja';
import ArqueoCaja from './pages/sales/ArqueoCaja';
import RecargaView from './pages/sales/RecargaView';
import ClienteAbonos from './pages/sales/ClienteAbonos';

// Purchases
import OrdenCompra from './pages/purchases/OrdenCompra';
import ProveedorPagos from './pages/purchases/ProveedorPagos';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-bold text-primary text-center mb-8">TECH4BISS</h1>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Redirect root to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={
          <PosLayout>
            <Dashboard />
          </PosLayout>
        } />

        {/* POS Route */}
        <Route path="/pos" element={<PosLayout><PosView /></PosLayout>} />

        {/* Inventory */}
        <Route path="/productos" element={<PosLayout><ProductoManagement /></PosLayout>} />
        <Route path="/categorias" element={<PosLayout><CategoriaManagement /></PosLayout>} />
        <Route path="/entradas" element={<PosLayout><EntradaStock /></PosLayout>} />
        {/* <Route path="/ajustes" element={<PosLayout><AjusteStock /></PosLayout>} /> */}
        <Route path="/transferencias" element={<PosLayout><TransferenciaForm /></PosLayout>} />
        <Route path="/caducidades" element={<PosLayout><CaducidadReport /></PosLayout>} />
        <Route path="/existencias" element={<PosLayout><ReporteExistencias /></PosLayout>} />
        <Route path="/bajo-stock" element={<PosLayout><div className="p-4"><h1>Bajo Stock (En Desarrollo)</h1></div></PosLayout>} />

        {/* Sales & Cash */}
        <Route path="/ventas" element={<PosLayout><ReporteVentas /></PosLayout>} />
        <Route path="/corte-caja" element={<PosLayout><CorteCaja /></PosLayout>} />
        <Route path="/arqueo-caja" element={<PosLayout><ArqueoCaja /></PosLayout>} />
        <Route path="/recargas" element={<PosLayout><RecargaView /></PosLayout>} />

        {/* People */}
        <Route path="/clientes" element={<PosLayout><ClienteManagement /></PosLayout>} />
        <Route path="/proveedores" element={<PosLayout><ProveedorManagement /></PosLayout>} />
        <Route path="/abonos-clientes" element={<PosLayout><ClienteAbonos /></PosLayout>} />

        {/* Purchases */}
        <Route path="/ordenes-compra" element={<PosLayout><OrdenCompra /></PosLayout>} />
        <Route path="/pagos-proveedores" element={<PosLayout><ProveedorPagos /></PosLayout>} />

        {/* Settings */}
        <Route path="/usuarios" element={<PosLayout><UserManagement /></PosLayout>} />
        <Route path="/perfil" element={<PosLayout><Perfil /></PosLayout>} /> {/* Profile Route */}
        <Route path="/configuracion" element={<PosLayout><Configuracion /></PosLayout>} />
        <Route path="/descuentos" element={<PosLayout><ConfigurarDescuentos /></PosLayout>} />


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;