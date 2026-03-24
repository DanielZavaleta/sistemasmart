import React, { useState, useMemo, useEffect } from 'react';
import { IconCash, IconCreditCard, IconReceipt, IconCurrencyDollar, IconBuildingBank, IconUserDollar, IconX } from '@tabler/icons-react';

const PaymentModal = ({ total, onClose, onConfirm, cliente }) => {
  const [pagos, setPagos] = useState([]);
  const [currentAmount, setCurrentAmount] = useState('');
  const [activeMethod, setActiveMethod] = useState('efectivo');
  const [tcDollar, setTcDollar] = useState(20.00); // Default TC
  const [error, setError] = useState('');

  // Metodos disponibles
  const metodos = [
    { id: 'efectivo', label: 'Efectivo', icon: <IconCash size={24} /> },
    { id: 'tarjeta', label: 'Tarjeta', icon: <IconCreditCard size={24} /> },
    { id: 'transferencia', label: 'Transf.', icon: <IconBuildingBank size={24} /> },
    { id: 'vales', label: 'Vales', icon: <IconReceipt size={24} /> },
    { id: 'dolares', label: 'Dólares', icon: <IconCurrencyDollar size={24} /> },
    { id: 'credito', label: 'Crédito', icon: <IconUserDollar size={24} />, disabled: !cliente || !cliente.permite_credito },
  ];

  const totalPagado = useMemo(() => {
    return pagos.reduce((acc, p) => {
      let amount = parseFloat(p.monto);
      if (p.metodo === 'dolares') {
        amount = amount * p.tc;
      }
      return acc + amount;
    }, 0);
  }, [pagos]);

  const restante = Math.max(0, total - totalPagado);
  const cambio = Math.max(0, totalPagado - total);

  // Auto-fill current amount with remaining
  useEffect(() => {
    if (restante <= 0.01) {
      setCurrentAmount('');
      return;
    }

    if (activeMethod === 'dolares') {
      setCurrentAmount((restante / tcDollar).toFixed(2));
    } else {
      setCurrentAmount(restante.toFixed(2));
    }
  }, [activeMethod, totalPagado, restante, tcDollar]);

  const handleAddPayment = () => {
    const val = parseFloat(currentAmount);
    if (!val || val <= 0) return;

    // Validation for specifics
    if (activeMethod === 'credito') {
      if (!cliente) {
        setError('Debe seleccionar un cliente para venta a crédito.');
        return;
      }
      // Check limit if logic requires it here (or backend)
      // if (cliente.limite_credito > 0 ...)
    }

    const nuevoPago = {
      metodo: activeMethod,
      monto: val,
      id: Date.now(),
      tc: activeMethod === 'dolares' ? tcDollar : 1
    };

    setPagos([...pagos, nuevoPago]);
    setError('');
  };

  const removePago = (id) => {
    setPagos(pagos.filter(p => p.id !== id));
  };

  const handleConfirm = () => {
    if (totalPagado < total) {
      setError('El pago total no cubre el monto de la venta.');
      return;
    }
    // Transformar para el backend a la estructura que espera (array de { metodo, monto })
    const payload = pagos.map(p => ({
      metodo: p.metodo,
      monto: parseFloat(p.monto), // Monto original (ej. 10 dolares)
      tc: p.tc
    }));
    onConfirm(payload);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentAmount && parseFloat(currentAmount) > 0) {
        handleAddPayment();
      } else if (totalPagado >= total) {
        handleConfirm();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[600px]">

        {/* Left: Input Selection */}
        <div className="w-full md:w-1/2 p-6 bg-gray-50 flex flex-col border-r border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Seleccione Forma de Pago</h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {metodos.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                disabled={m.disabled}
                className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border
                                    ${activeMethod === m.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                  }
                                    ${m.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
              >
                {m.icon}
                <span className="font-medium text-sm">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Monto a cobrar ({activeMethod.toUpperCase()})
            </label>

            {activeMethod === 'dolares' && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 rounded border border-yellow-100">
                <span className="text-xs font-bold text-yellow-700">Tipo Cambio:</span>
                <input
                  type="number"
                  value={tcDollar}
                  onChange={e => setTcDollar(parseFloat(e.target.value))}
                  className="w-20 p-1 text-right text-sm border-gray-300 rounded"
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-3xl font-bold p-3 border-2 border-blue-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/20 text-gray-800"
                autoFocus
                placeholder="0.00"
              />
              <button
                onClick={handleAddPayment}
                className="bg-gray-800 text-white px-6 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                Agregar
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 font-medium animate-pulse">{error}</p>}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-full md:w-1/2 p-0 flex flex-col bg-white">
          <div className="bg-blue-600 p-6 text-white text-center">
            <p className="opacity-80 text-sm uppercase tracking-wider font-semibold">Total a Pagar</p>
            <h1 className="text-5xl font-black mt-1">${total.toFixed(2)}</h1>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Pagos Registrados</h4>
            {pagos.length === 0 && (
              <div className="text-center text-gray-300 py-10">
                <IconReceipt size={48} className="mx-auto mb-2 opacity-30" />
                <p>No hay pagos agregados</p>
              </div>
            )}
            <div className="space-y-3">
              {pagos.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-blue-600 border border-gray-100">
                      {metodos.find(m => m.id === p.metodo)?.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 capitalize">{p.metodo}</p>
                      {p.metodo === 'dolares' && <p className="text-xs text-gray-500">USD ${p.monto} x {p.tc}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">
                      ${(p.metodo === 'dolares' ? p.monto * p.tc : p.monto).toFixed(2)}
                    </span>
                    <button onClick={() => removePago(p.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <IconX size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between mb-2 text-gray-600">
              <span>Pagado:</span>
              <span className="font-bold text-gray-800">${totalPagado.toFixed(2)}</span>
            </div>

            {cambio > 0 ? (
              <div className="flex justify-between mb-4 text-green-600 text-lg">
                <span className="font-bold">Cambio:</span>
                <span className="font-black">${cambio.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between mb-4 text-red-500 text-lg">
                <span className="font-bold">Restante:</span>
                <span className="font-black">${restante.toFixed(2)}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={totalPagado < total}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all
                                    ${totalPagado >= total
                    ? 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'
                    : 'bg-gray-400 cursor-not-allowed'
                  }
                                `}
              >
                <span className="flex items-center justify-center gap-2">
                  <IconReceipt size={20} /> Finalizar Venta
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;