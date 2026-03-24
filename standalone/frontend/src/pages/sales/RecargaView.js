import React, { useState } from 'react';
import { registrarRecarga } from '../../services/apiService';
import PrintableReceipt from '../../components/shared/PrintableReceipt';


const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5h-1.052a10.5 10.5 0 0 1-10.5-10.5V3.5Z" clipRule="evenodd" />
  </svg>
);

const RecargaView = () => {
  const [numero, setNumero] = useState('');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [lastSale, setLastSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const montosRapidos = [20, 50, 100, 150, 200, 500];

  const handleSetMonto = (valor) => {
    setMonto(valor.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numero.length !== 10) {
      setError('El número debe ser de 10 dígitos.');
      return;
    }
    if (parseFloat(monto) <= 0) {
      setError('El monto debe ser válido.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        numero: numero,
        monto: monto,
      };

      const response = await registrarRecarga(payload);

      // Éxito: Limpiar formulario y mostrar recibo
      setIsLoading(false);
      setNumero('');
      setMonto('');
      setLastSale(response.data); // Guardar venta
      setShowReceiptModal(true); // Mostrar recibo

    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.error || 'Error al procesar la recarga.');
    }
  };

  return (
    <>
      {showReceiptModal && lastSale && (
        <PrintableReceipt
          venta={lastSale}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      <div className="w-full max-w-md p-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Venta de Tiempo Aire
        </h2>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="numero">
              Número de Teléfono (10 dígitos)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <PhoneIcon />
              </span>
              <input
                id="numero"
                type="tel"
                value={numero}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} // Solo números
                placeholder="5512345678"
                className="p-3 pl-10 bg-gray-700 rounded w-full text-lg"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Selección Rápida
            </label>
            <div className="grid grid-cols-3 gap-2">
              {montosRapidos.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSetMonto(m)}
                  className={`p-3 rounded font-bold ${monto === m.toString() ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                >
                  ${m}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="monto">
              Otro Monto
            </label>
            <input
              id="monto"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="p-3 bg-gray-700 rounded w-full text-lg"
              step="10"
              min="10"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg disabled:bg-gray-500"
          >
            {isLoading ? 'Procesando Recarga...' : 'Vender Recarga'}
          </button>
        </form>
      </div>
    </>
  );
};

export default RecargaView;