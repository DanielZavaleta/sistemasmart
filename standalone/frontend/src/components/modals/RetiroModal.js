import React, { useState } from 'react';
import { createRetiro } from '../../services/apiService';
import { IconCashBanknote, IconX } from '@tabler/icons-react';

const RetiroModal = ({ onClose, onSuccess }) => {
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!monto || parseFloat(monto) <= 0) {
            setError('Monto inválido');
            return;
        }
        if (!motivo.trim()) {
            setError('Debe especificar un motivo');
            return;
        }

        setLoading(true);
        try {
            await createRetiro({ monto, motivo });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Error al procesar el retiro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <IconCashBanknote /> Retirar Efectivo
                    </h3>
                    <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full"><IconX size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-medium">{error}</div>}

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Monto a Retirar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-700 font-bold">$</span>
                            <input
                                type="number"
                                value={monto}
                                onChange={e => setMonto(e.target.value)}
                                className="w-full pl-8 p-3 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-0 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Motivo / Concepto</label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:border-red-500 outline-none"
                            placeholder="Ej. Pago de garrafones, Compra de insumos..."
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Retiro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RetiroModal;
