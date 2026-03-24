import React, { useState, useEffect } from 'react';
import { getCaducidades } from '../../services/apiService';

// Icono
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
  </svg>
);

const CaducidadReport = () => {
  const [items, setItems] = useState([]);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCaducidades = async () => {
      try {
        setIsLoading(true);
        const res = await getCaducidades(days);
        setItems(res.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar el reporte de caducidades.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaducidades();
  }, [days]); // Recargar si el nro de días cambia

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full max-w-6xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800">Alertas de Caducidad</h2>
        <div className="flex items-center">
          <label htmlFor="days" className="mr-2 text-gray-700">Alertar a:</label>
          <input
            id="days"
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="p-2 bg-white border border-gray-200 text-gray-800 rounded w-24 focus:ring-1 focus:ring-cyan-500 outline-none"
          />
          <span className="ml-2 text-gray-700">días</span>
        </div>
      </div>

      {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

      <div className="bg-white border border-gray-200 shadow-md rounded shadow-md overflow-x-auto">
        {isLoading && <p className="p-4 text-gray-600">Cargando reporte...</p>}
        {!isLoading && items.length === 0 && (
          <p className="p-4 text-green-700 font-medium">¡Excelente! No hay productos próximos a caducar en los siguientes {days} días.</p>
        )}

        {items.length > 0 && (
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4">Fecha Caducidad</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Código</th>
                <th className="p-4">Cantidad</th>
                <th className="p-4">Costo Unit.</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Fecha Entrada</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isExpired = item.fecha_caducidad < today;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 ${isExpired ? 'bg-red-50 text-red-800 hover:bg-red-100' : 'hover:bg-gray-100'}`}
                  >
                    <td className="p-4 font-bold">
                      {isExpired && <AlertIcon className="inline text-red-600" />}
                      <span className={isExpired ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                        {item.fecha_caducidad}
                      </span>
                    </td>
                    <td className="p-4">{item.producto_nombre}</td>
                    <td className="p-4">{item.producto_codigo}</td>
                    <td className="p-4">{item.cantidad_disponible}</td>
                    <td className="p-4">${item.costo_unitario}</td>
                    <td className="p-4">{item.proveedor_nombre || 'N/A'}</td>
                    <td className="p-4">{new Date(item.fecha_entrada).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CaducidadReport;