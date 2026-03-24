import React, { useState, useEffect, useRef } from 'react';

const StockQuantityModal = ({ isOpen, onClose, onConfirm, productName }) => {
    const [quantity, setQuantity] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setQuantity('');
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedQty = parseFloat(quantity);
        if (!parsedQty || parsedQty <= 0) {
            alert("Por favor ingrese una cantidad válida mayor a 0");
            return;
        }
        onConfirm(parsedQty);
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Cantidad</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <h6 className="fw-bold mb-3 text-primary">{productName}</h6>
                            <div className="mb-3">
                                <label className="form-label">Ingrese Cantidad (Kg/Lt/Pza):</label>
                                <input
                                    ref={inputRef}
                                    type="number"
                                    step="0.001"
                                    className="form-control form-control-lg text-center fw-bold"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0.000"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockQuantityModal;
