
import React, { useState, useRef } from 'react';
import { getCalculoCorte } from '../../services/apiService';
import PrintableArqueo from '../../components/shared/PrintableArqueo';
import { IconPrinter } from '@tabler/icons-react';

const ArqueoCaja = () => {
    const [loading, setLoading] = useState(false);
    const [calculo, setCalculo] = useState(null);
    const [error, setError] = useState('');

    const handlePrintArqueo = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getCalculoCorte();
            setCalculo(response.data);
            
            // Wait for state update and render, then print
            setTimeout(() => {
                window.print();
                setLoading(false);
                // Opcional: limpiar data después de imprimir si se desea
                // setCalculo(null); 
            }, 500);

        } catch (err) {
            console.error(err);
            setError('Error al obtener datos del corte.');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-[80vh] bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Arqueo de Caja</h1>
            
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                <p className="text-gray-600 mb-6">
                    Presiona el botón para generar e imprimir el reporte de arqueo del turno actual.
                    <br/>
                    <span className="text-sm text-gray-600">(No cierra el turno en el sistema)</span>
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePrintArqueo}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg text-white font-bold text-xl transition-all ${
                        loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                    }`}
                >
                    <IconPrinter size={32} />
                    {loading ? 'Generando...' : 'IMPRIMIR ARQUEO'}
                </button>
            </div>

             {/* Componente Oculto en Pantalla, Visible en Impresión */}
            {calculo && (
                <div className="hidden print:block">
                     <PrintableArqueo data={calculo} />
                </div>
            )}
            
            {/* Hack para asegurar que el componente se renderiza para imprimir, 
                pero no rompe el layout en pantalla. 
                Usamos 'hidden' de Tailwind que es display:none. 
                Pero index.css @media print hace .printable-receipt visibility:visible.
                Si el padre es display:none, el hijo no se ve.
                Necesitamos un contenedor que sea invisible pero display block? 
                O usar una clase específica. 
            */}
            <style>{`
                @media print {
                    .print-container {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                    }
                    /* Ocultar el resto de la UI está manejado por index.css body * visibility: hidden */
                }
            `}</style>
            
            <div className="print-container hidden">
                {calculo && <PrintableArqueo data={calculo} />}
            </div>

        </div>
    );
};

export default ArqueoCaja;


