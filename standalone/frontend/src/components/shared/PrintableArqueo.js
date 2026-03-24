
import React from 'react';

const PrintableArqueo = ({ data }) => {
    if (!data) return null;

    const {
        fecha_inicio,
        fecha_fin,
        ventas_efectivo,
        ventas_tarjeta,
        ventas_credito,
        total_ventas,
        pagos_proveedores,
        retiros,
        abonos,
        total_caja_teorico,
        hora_inicio_turno,
        hora_fin_turno
    } = data;

    return (
        <div className="printable-receipt p-4 text-sm font-mono text-black" style={{ maxWidth: '300px', margin: '0 auto' }}>
            {/* Encabezado */}
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase">Arqueo de Caja</h2>
                <p>CORTE X (Parcial)</p>
                <p className="mt-2">{new Date().toLocaleString()}</p>
            </div>

            {/* Periodo */}
            <div className="mb-4 text-xs border-b border-dashed border-black pb-2">
                <div className="flex justify-between">
                    <span>Inicio:</span>
                    <span>{new Date(hora_inicio_turno).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Fin:</span>
                    <span>{new Date(hora_fin_turno).toLocaleString()}</span>
                </div>
            </div>

            {/* Ventas */}
            <div className="mb-2">
                <h3 className="font-bold border-b border-black mb-1">Ventas</h3>
                <div className="flex justify-between">
                    <span>(+) Efectivo:</span>
                    <span>${parseFloat(ventas_efectivo).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Tarjeta:</span>
                    <span>${parseFloat(ventas_tarjeta).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>(+) Crédito:</span>
                    <span>${parseFloat(ventas_credito).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-dashed border-black mt-1 pt-1">
                    <span>Total Ventas:</span>
                    <span>${parseFloat(total_ventas).toFixed(2)}</span>
                </div>
            </div>

            {/* Ingresos Adicionales */}
            {(parseFloat(abonos) > 0) && (
                <div className="mb-2">
                    <h3 className="font-bold border-b border-black mb-1">Ingresos Extra</h3>
                    <div className="flex justify-between">
                        <span>(+) Abonos Clientes:</span>
                        <span>${parseFloat(abonos).toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Egresos */}
            <div className="mb-2">
                <h3 className="font-bold border-b border-black mb-1">Egresos</h3>
                <div className="flex justify-between">
                    <span>(-) Pagos Prov.:</span>
                    <span>${parseFloat(pagos_proveedores).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>(-) Retiros:</span>
                    <span>${parseFloat(retiros).toFixed(2)}</span>
                </div>
            </div>

            {/* Total Caja */}
            <div className="mt-4 border-t-2 border-black pt-2 mb-8">
                <div className="flex justify-between text-lg font-bold">
                    <span>Total Efectivo:</span>
                    <span>${parseFloat(total_caja_teorico).toFixed(2)}</span>
                </div>
                <p className="text-center text-xs text-gray-700 mt-1">(Teórico en Sistema)</p>
            </div>

            {/* Firmas */}
            <div className="mt-12 space-y-12">
                <div className="border-t border-black pt-2 text-center w-3/4 mx-auto">
                    <p>Firma Cajero</p>
                </div>
                <div className="border-t border-black pt-2 text-center w-3/4 mx-auto">
                    <p>Firma Supervisor</p>
                </div>
            </div>
        </div>
    );
};

export default PrintableArqueo;
