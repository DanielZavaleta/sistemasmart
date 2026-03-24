import React, { useEffect, useState } from 'react';
import { getConfig } from '../../services/apiService';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


const PrintableReceipt = ({ venta, onClose }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    getConfig().then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
            setConfig(res.data[0]);
        } else {
            setConfig(res.data);
        }
    }).catch(err => console.error(err));
  }, []);

  const handlePrint = () => {
    window.print(); 
  };

  const totalEfectivo = venta.pagos
    .filter(p => p.metodo === 'efectivo')
    .reduce((acc, p) => acc + parseFloat(p.monto), 0);

  const cambio = totalEfectivo - venta.total > 0 ? totalEfectivo - venta.total : 0;
  
  const fontSize = config?.ticket_font_size || 12;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Scrollable Content */}
        <div className="printable-receipt p-6 overflow-y-auto flex-1 text-center" style={{ fontSize: `${fontSize}px` }}>
          
          {/* Logo */}
          {config?.logo && config?.mostrar_logo && (
              <div className="flex justify-center mb-2">
                  <img src={config.logo} alt="Logo" className="max-w-[150px] max-h-[100px] object-contain grayscale" />
              </div>
          )}

          <div className="mb-4">
            <h2 className="font-bold uppercase text-lg">{config?.nombre_tienda || 'Mi Tienda POS'}</h2>
            
            { config?.mostrar_encabezado && (
                <>
                    {config?.direccion && <p>{config.direccion}</p>}
                    {config?.telefono && <p>Tel: {config.telefono}</p>}
                    {config?.rfc && <p>RFC: {config.rfc}</p>}
                    {config?.encabezado_personalizado && (
                        <p className="mt-2 whitespace-pre-wrap font-medium">{config.encabezado_personalizado}</p>
                    )}
                </>
            )}

            <div className="border-t border-dashed border-gray-400 my-2 pt-2 text-left">
                <p>Fecha: {new Date(venta.creado_en).toLocaleString()}</p>
                <p>Folio: #{venta.id}</p>
                <p>Cajero: {venta.cajero_username}</p>
                {venta.cliente && <p>Cliente: {venta.cliente.razon_social}</p>}
            </div>
          </div>

          <div className="border-t border-b border-dashed border-black py-2 my-2 text-left">
            <div className="flex justify-between font-bold" style={{ fontSize: '0.9em' }}>
              <span className="w-8">Cant</span>
              <span className="flex-1 px-1">Desc</span>
              <span className="text-right w-16">Importe</span>
            </div>
            {venta.items.map((item, index) => (
              <div key={index} className="flex justify-between my-1">
                <span className="w-8 text-center">{parseFloat(item.cantidad) % 1 === 0 ? parseInt(item.cantidad) : parseFloat(item.cantidad)}</span>
                <span className="flex-1 px-1 leading-tight">{item.producto_nombre}</span>
                <span className="text-right w-16">${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="text-right mt-2 space-y-1">
            <div className="font-bold text-lg">
              <span>TOTAL: </span>
              <span>${parseFloat(venta.total).toFixed(2)}</span>
            </div>
            
            <div style={{ fontSize: '0.9em' }}>
                {venta.pagos.map((p, index) => (
                <div key={index}>
                    <span>{p.metodo.toUpperCase()}: </span>
                    <span>${parseFloat(p.monto).toFixed(2)}</span>
                </div>
                ))}
                {cambio > 0 && (
                <div className="font-bold mt-1">
                    <span>CAMBIO: </span>
                    <span>${cambio.toFixed(2)}</span>
                </div>
                )}
            </div>
          </div>
          
          {config?.mostrar_pie && (
              <p className="text-center mt-6 whitespace-pre-wrap italic">
                {config?.mensaje_ticket || '¡Gracias por su compra!'}
              </p>
          )}
        </div>

        {/* Footer Actions (No Print) */}
        <div className="no-print p-4 bg-gray-100 flex justify-between border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center bg-gray-50 border border-gray-100 hover:bg-gray-100 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            <CloseIcon />
            <span className="ml-2">Cerrar</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
          >
            <span>🖨️</span> Imprimir (Ctrl+P)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;