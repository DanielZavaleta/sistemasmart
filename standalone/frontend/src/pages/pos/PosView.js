import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProductos, registrarVenta, createTicketSuspendido, getTicketSuspendidos, deleteTicketSuspendido, getDescuentos } from '../../services/apiService';

import PaymentModal from '../../components/modals/PaymentModal';
import PrintableReceipt from '../../components/shared/PrintableReceipt';
import AuthorizationModal from '../../components/modals/AuthorizationModal';
import StockQuantityModal from '../../components/modals/StockQuantityModal';
import ClientSearchModal from '../../components/modals/ClientSearchModal';
// Import icons (using Feather/Tabler classes directly where possible, or keeping custom if needed)
import { CartIcon, PlusIcon, MinusIcon, TrashIcon, DrawerIcon, PauseIcon, ClockIcon } from '../../components/shared/Icons';

// Helper for image path (placeholder for now)
const PRODUCT_PLACEHOLDER = "assets/img/products/pos-product-01.png"; // Make sure this exists or use a generic one

const PosView = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [ticketItems, setTicketItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [saleError, setSaleError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Estados para tickets suspendidos
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendedTickets, setSuspendedTickets] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [descuentos, setDescuentos] = useState([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState('');


  // Estados para Modal de Granel
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [productForQuantity, setProductForQuantity] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Hotkeys Effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (ticketItems.length > 0) {
          setIsModalOpen(true);
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isModalOpen) setIsModalOpen(false);
        else if (isAuthModalOpen) setIsAuthModalOpen(false);
        else if (isSuspendModalOpen) setIsSuspendModalOpen(false);
        else if (showReceiptModal) setShowReceiptModal(false);
        else if (isQuantityModalOpen) setIsQuantityModalOpen(false);
        else if (ticketItems.length > 0) {
          // Si no hay modal y hay items, invocar cancelación (auth)
          setIsAuthModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticketItems.length, isModalOpen, isAuthModalOpen, isSuspendModalOpen, showReceiptModal, isQuantityModalOpen]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await getProductos();
        setAllProducts(response.data);
        setIsLoading(false);
      } catch (err) {
        setError('Error al cargar el catálogo de productos.');
        setIsLoading(false);
      }
    };

    const fetchDiscountData = async () => {
      try {
        const res = await getDescuentos();
        setDescuentos(res.data);
      } catch (err) {
        console.error("Error loading discounts", err);
      }
    };

    fetchAllProducts();
    fetchDiscountData();
  }, []);

  // Effect: Auto-select discount when Client changes
  useEffect(() => {
    if (selectedCliente && selectedCliente.descuento_id) {
      setSelectedDiscountId(selectedCliente.descuento_id);
    } else {
      setSelectedDiscountId('');
    }
  }, [selectedCliente]);

  const currentDiscountPercentage = useMemo(() => {
    if (!selectedDiscountId) return 0;
    const discount = descuentos.find(d => d.id === parseInt(selectedDiscountId));
    return discount ? parseFloat(discount.porcentaje) : 0;
  }, [selectedDiscountId, descuentos]);


  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return allProducts.slice(0, 50); // Show initial products if no search
    }
    const lowerSearch = searchTerm.toLowerCase();
    return allProducts.filter(product =>
      product.descripcion.toLowerCase().includes(lowerSearch) ||
      product.codigo_barras.toLowerCase().includes(lowerSearch)
    ).slice(0, 50);
  }, [searchTerm, allProducts]);

  const addProductToTicket = (product) => {
    setSaleError(null);

    // HU-31: Validación de Granel
    if (product.tipo_venta === 'GRANEL') {
      setProductForQuantity(product);
      setIsQuantityModalOpen(true);
      setSearchTerm('');
      return;
    }

    addResolvedProductToTicket(product, 1);
  };

  const addResolvedProductToTicket = (product, cantidad) => {
    setTicketItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        return [...prevItems, { ...product, cantidad: cantidad }];
      }
    });
    setSearchTerm('');
  };

  const handleQuantityConfirm = (qty) => {
    if (productForQuantity) {
      addResolvedProductToTicket(productForQuantity, qty);
      setIsQuantityModalOpen(false);
      setProductForQuantity(null);
    }
  };

  const updateItemQuantity = (productId, newQuantity) => {
    setSaleError(null);
    setTicketItems(prevItems => {
      if (newQuantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      } else {
        return prevItems.map(item =>
          item.id === productId
            ? { ...item, cantidad: newQuantity }
            : item
        );
      }
    });
  };

  const totalTicket = useMemo(() => {
    return ticketItems.reduce((total, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      const precioBase = parseFloat(item.precio_1) || 0;
      let precioFinal = precioBase;

      if (item.permite_descuento && currentDiscountPercentage > 0) {
        precioFinal = precioBase * (1 - currentDiscountPercentage / 100);
      }

      return total + (cantidad * precioFinal);
    }, 0);
  }, [ticketItems, currentDiscountPercentage]);


  const handleRegistrarVenta = async (pagos) => {
    setSaleError(null);
    const payload = {
      total: totalTicket.toFixed(2),
      cliente: selectedCliente ? selectedCliente.id : null,
      items: ticketItems.map(item => {
        const precioBase = parseFloat(item.precio_1) || 0;
        let precioFinal = precioBase;
        if (item.permite_descuento && currentDiscountPercentage > 0) {
          precioFinal = precioBase * (1 - currentDiscountPercentage / 100);
        }
        return {
          id: item.id,
          cantidad: item.cantidad,
          precio_unitario: precioFinal.toFixed(2),
        };
      }),
      pagos: pagos,
    };

    try {
      const response = await registrarVenta(payload);
      setTicketItems([]);
      setIsModalOpen(false);
      setLastSale(response.data);
      setShowReceiptModal(true);
      setSelectedCliente(null);
      setSelectedDiscountId('');

    } catch (err) {
      const errorMsg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Error al procesar la venta.';
      setSaleError(errorMsg);
    }
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setSaleError(null);
  };

  const handleOpenDrawer = async () => {
    console.log("Abriendo cajón de dinero...");
    if (window.electronAPI && window.electronAPI.openCashDrawer) {
      try {
        const result = await window.electronAPI.openCashDrawer();
        if (result.success) {
          console.log(result.message);
        } else {
          console.error("Error abriendo cajón:", result.error);
          alert("Error al abrir cajón: " + result.error);
        }
      } catch (e) {
        console.error("Error IPC:", e);
      }
    } else {
      console.warn("Electron API not available");
    }
  };

  // --- Lógica de Suspensión de Tickets ---

  const handleSuspendTicket = async () => {
    if (ticketItems.length === 0) return;

    // Preparar items
    const itemsData = ticketItems.map(item => ({
      id: item.id,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_1: item.precio_1,
    }));

    try {
      await createTicketSuspendido({
        items_json: itemsData,
        cliente: selectedCliente ? selectedCliente.id : null
      });
      setTicketItems([]);
      setSaleError(null);
      alert("Ticket puesto en espera.");
    } catch (err) {
      console.error(err);
      alert("Error al suspender el ticket.");
    }
  };

  const handleOpenRetrieveModal = async () => {
    try {
      const res = await getTicketSuspendidos();
      setSuspendedTickets(res.data);
      setIsSuspendModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Error al obtener tickets en espera.");
    }
  };

  const handleRetrieveTicket = async (ticket) => {
    if (ticketItems.length > 0) {
      if (!window.confirm("Hay artículos en el ticket actual. ¿Deseas reemplazarlos por el ticket recuperado?")) {
        return;
      }
    }

    try {
      setTicketItems(ticket.items_json);
      await deleteTicketSuspendido(ticket.id);
      setIsSuspendModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error al recuperar el ticket.");
    }
  };

  return (
    <>
      <div className="content pos-design p-0 h-100 overflow-hidden">
        <div className="row g-0 h-100">
          {/* LADO IZQUIERDO: PRODUCTOS */}
          <div className="col-md-12 col-lg-8 bg-gray-50 h-100 d-flex flex-column border-end">
            {/* Header de Búsqueda Mejorado */}
            <div className="pos-header p-3 bg-white border-bottom shadow-sm z-1">
              <div className="row align-items-center">
                <div className="col-md-7 col-lg-8">
                  <div className="input-group input-group-lg bg-light rounded-pill border">
                    <span className="input-group-text bg-transparent border-0 ps-3">
                      <i className="ti ti-search fs-5 text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-transparent border-0 shadow-none"
                      placeholder="Escanear o buscar producto (F10)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      ref={searchInputRef}
                    />
                    {searchTerm && (
                      <button className="btn btn-link text-muted" onClick={() => setSearchTerm('')}>
                        <i className="ti ti-x"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-5 col-lg-4 text-end">
                  <div className="btn-group">
                    <button className="btn btn-outline-warning" onClick={handleSuspendTicket} title="Poner en espera">
                      <i className="ti ti-player-pause me-2"></i>Espera
                    </button>
                    <button className="btn btn-outline-info" onClick={handleOpenRetrieveModal} title="Recuperar ticket">
                      <i className="ti ti-clock-hour-4 me-2"></i>Recuperar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Productos (Modo Tabla) */}
            <div className="flex-fill overflow-y-auto bg-white">
              {isLoading && (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              )}

              {!isLoading && (
                <div className="table-responsive h-100">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light sticky-top shadow-sm text-secondary small uppercase">
                      <tr>
                        <th style={{ width: '60px' }} className="ps-4">IMG</th>
                        <th>Descripción</th>
                        <th className="text-center" style={{ width: '100px' }}>Stock</th>
                        <th className="text-end" style={{ width: '120px' }}>Precio</th>
                        <th style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr
                          key={product.id}
                          className="cursor-pointer transition-colors hover:bg-gray-50 product-row"
                          onClick={() => addProductToTicket(product)}
                        >
                          <td className="ps-4">
                            <img
                              src={product.imagen || PRODUCT_PLACEHOLDER}
                              className="rounded border"
                              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                              alt="prod"
                              onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                            />
                          </td>
                          <td>
                            <div className="fw-bold text-dark text-truncate">{product.descripcion}</div>
                            <small className="text-muted d-flex align-items-center gap-1">
                              <i className="ti ti-barcode"></i> {product.codigo_barras}
                            </small>
                          </td>
                          <td className="text-center">
                            <span className={`badge rounded-pill ${product.stock_actual > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                              {product.stock_actual}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className="fw-bold text-primary fs-6">${product.precio_1}</span>
                          </td>
                          <td className="text-center text-muted">
                            <i className="ti ti-plus fs-5"></i>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredProducts.length === 0 && !isLoading && (
                <div className="d-flex flex-column justify-content-center align-items-center h-50 text-muted mt-5">
                  <div className="bg-light rounded-circle p-4 mb-3">
                    <i className="ti ti-package-off fs-1 text-secondary"></i>
                  </div>
                  <h5>No se encontraron productos</h5>
                  <p className="small">Intenta buscar con otro término o código.</p>
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: TICKET */}
          <div className="col-md-12 col-lg-4 bg-white h-100 d-flex flex-column shadow-lg">
            <div className="order-list-header p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold"><i className="ti ti-shopping-cart me-2"></i>Ticket Actual</h5>
              <span className="badge bg-primary rounded-pill">{ticketItems.length} items</span>
            </div>

            {/* Cliente Seleccionado */}
            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block uppercase" style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Cliente</small>
                <div className="fw-bold text-dark">{selectedCliente ? selectedCliente.razon_social : 'Público General'}</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setIsClientModalOpen(true)}>
                <i className="ti ti-user-search me-1"></i> Cambiar
              </button>
            </div>

            {/* Selector de Descuento */}
            <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center">
              <small className="text-muted me-2 fw-bold uppercase" style={{ fontSize: '0.7rem' }}>Descuento:</small>
              <select
                className="form-select form-select-sm"
                value={selectedDiscountId}
                onChange={(e) => setSelectedDiscountId(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="">Ninguno</option>
                {descuentos.map(d => (
                  <option key={d.id} value={d.id}>{d.porcentaje}% - {d.descripcion}</option>
                ))}
              </select>
            </div>


            <div className="flex-fill overflow-y-auto p-0">
              {saleError && <div className="alert alert-danger m-3">{saleError}</div>}

              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light sticky-top">
                    <tr>
                      <th className="border-bottom-0">Producto</th>
                      <th className="border-bottom-0 text-center" style={{ width: '100px' }}>Cant</th>
                      <th className="border-bottom-0 text-end">Total</th>
                      <th className="border-bottom-0" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketItems.map(item => (
                      <tr key={item.id}>
                        <td className="align-middle">
                          <div className="fw-bold text-truncate" style={{ maxWidth: '150px' }}>{item.descripcion}</div>
                          <small className="text-muted">${item.precio_1}</small>
                        </td>
                        <td className="align-middle">
                          <div className="input-group input-group-sm">
                            <button className="btn btn-outline-secondary" onClick={() => updateItemQuantity(item.id, item.cantidad - 1)}>-</button>
                            <input type="text" className="form-control text-center px-1" value={item.cantidad} readOnly />
                            <button className="btn btn-outline-secondary" onClick={() => updateItemQuantity(item.id, item.cantidad + 1)}>+</button>
                          </div>
                        </td>
                        <td className="align-middle text-end fw-bold">
                          {item.permite_descuento && currentDiscountPercentage > 0 ? (
                            <div>
                              <span className="text-muted text-decoration-line-through me-1" style={{ fontSize: '0.8rem' }}>
                                ${(item.cantidad * item.precio_1).toFixed(2)}
                              </span>
                              <span className="text-success">
                                ${(item.cantidad * item.precio_1 * (1 - currentDiscountPercentage / 100)).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span>${(item.cantidad * item.precio_1).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="align-middle text-end">

                          <a href="#" className="text-danger" onClick={(e) => { e.preventDefault(); updateItemQuantity(item.id, 0); }}>
                            <i className="ti ti-trash"></i>
                          </a>
                        </td>
                      </tr>
                    ))}
                    {ticketItems.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted">
                          <i className="ti ti-shopping-cart-off fs-1 mb-2 d-block"></i>
                          Ticket vacío
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-light border-top">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Subtotal</span>
                <span className="fw-bold">${totalTicket.toFixed(2)}</span>
              </div>
              {/* Impuestos si hubiera */}
              <div className="d-flex justify-content-between align-items-center mb-4 pt-2 border-top">
                <span className="fs-5 fw-bold text-dark">Total a Pagar</span>
                <span className="fs-3 fw-bold text-primary">${totalTicket.toFixed(2)}</span>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg fw-bold"
                  onClick={() => setIsModalOpen(true)}
                  disabled={ticketItems.length === 0}
                >
                  <i className="ti ti-credit-card me-2"></i>Cobrar (F12)
                </button>
                <div className="row g-2">
                  <div className="col-6">
                    <button className="btn btn-outline-danger w-100" onClick={() => setIsAuthModalOpen(true)} disabled={ticketItems.length === 0}>
                      <i className="ti ti-trash me-1"></i>Cancelar
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-secondary w-100" onClick={handleOpenDrawer}>
                      <i className="ti ti-layout-bottombar me-1"></i>Cajón
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {isModalOpen && (
        <PaymentModal
          total={totalTicket}
          onConfirm={handleRegistrarVenta}
          onClose={() => setIsModalOpen(false)}
          cliente={selectedCliente}
        />
      )}

      {isClientModalOpen && (
        <ClientSearchModal
          onClose={() => setIsClientModalOpen(false)}
          onSelect={(c) => setSelectedCliente(c)}
        />
      )}

      <StockQuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => { setIsQuantityModalOpen(false); setProductForQuantity(null); }}
        onConfirm={handleQuantityConfirm}
        productName={productForQuantity?.descripcion || ''}
      />

      {showReceiptModal && lastSale && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body p-0">
                <PrintableReceipt venta={lastSale} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => { setShowReceiptModal(false); setLastSale(null); }}>
                  Cerrar (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSuspendModalOpen && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tickets Pendientes</h5>
                <button type="button" className="btn-close" onClick={() => setIsSuspendModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="list-group">
                  {suspendedTickets.map(t => (
                    <a key={t.id} href="#" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={(e) => { e.preventDefault(); handleRetrieveTicket(t); }}>
                      <div>
                        <div className="fw-bold">Ticket #{t.id}</div>
                        <small className="text-muted">{new Date(t.creado_en).toLocaleString()}</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">{t.items_json.length} items</span>
                    </a>
                  ))}
                  {suspendedTickets.length === 0 && <p className="text-center text-muted my-3">No hay tickets pendientes.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <AuthorizationModal
          action="cancel_ticket"
          onCancel={() => setIsAuthModalOpen(false)}
          onAuthorized={() => {
            handleClearTicket();
            setIsAuthModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default PosView;