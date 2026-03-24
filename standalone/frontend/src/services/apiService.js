import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL + 'token/', {
      username: username,
      password: password,
    });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
  } catch (error) {
    console.error('Error en el login:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getUsers = () => apiClient.get('users/');
export const createUser = (userData) => {
  userData.is_active = userData.is_active || false;
  return apiClient.post('users/', userData);
};
export const updateUser = (id, userData) => {
  if (userData.password === '') delete userData.password;
  return apiClient.put(`users/${id}/`, userData);
};
export const deleteUser = (id) => apiClient.delete(`users/${id}/`);
export const getGroups = () => apiClient.get('groups/');
export const getProductos = () => apiClient.get('productos/');
export const createProducto = (productoData) => apiClient.post('productos/', productoData);
export const updateProducto = (id, productoData) => apiClient.put(`productos/${id}/`, productoData);
export const deleteProducto = (id) => apiClient.delete(`productos/${id}/`);
export const getFamilias = () => apiClient.get('familias/');
export const createFamilia = (data) => apiClient.post('familias/', data);
export const updateFamilia = (id, data) => apiClient.put(`familias/${id}/`, data);
export const deleteFamilia = (id) => apiClient.delete(`familias/${id}/`);
export const getSubfamilias = () => apiClient.get('subfamilias/');
export const createSubfamilia = (data) => apiClient.post('subfamilias/', data);
export const updateSubfamilia = (id, data) => apiClient.put(`subfamilias/${id}/`, data);
export const deleteSubfamilia = (id) => apiClient.delete(`subfamilias/${id}/`);
// Users & Profile
export const getUser = (id) => apiClient.get(`users/${id}/`);
export const updateProfile = (id, data) => apiClient.patch(`users/${id}/`, data); // Specific for profile updates (often PATCH is better for partials)
// getSucursales was already exported above
export const getClientes = () => apiClient.get('clientes/');
export const createCliente = (data) => apiClient.post('clientes/', data);
export const updateCliente = (id, data) => apiClient.put(`clientes/${id}/`, data);
export const deleteCliente = (id) => apiClient.delete(`clientes/${id}/`);
export const getProveedores = () => apiClient.get('proveedores/');
export const createProveedor = (data) => apiClient.post('proveedores/', data);
export const updateProveedor = (id, data) => apiClient.put(`proveedores/${id}/`, data);
export const deleteProveedor = (id) => apiClient.delete(`proveedores/${id}/`);

export const registrarVenta = (payload) => {
  return apiClient.post('ventas/registrar/', payload);
};

export const authorizeAction = (payload) => {
  return apiClient.post('authorize/', payload);
};

export const registrarRecarga = (payload) => {
  return apiClient.post('recargas/vender/', payload);
};

export const getEntradasStock = () => {
  return apiClient.get('entradas/');
};
export const createEntradaStock = (payload) => {
  return apiClient.post('entradas/', payload);
};

export const getAjustesStock = () => {
  return apiClient.get('ajustes/');
};
export const createAjusteStock = (payload) => {
  return apiClient.post('ajustes/', payload);
};

export const getCaducidades = (days = 30) => {
  return apiClient.get(`inventario/caducidades/?days=${days}`);
};

export const getOrdenesCompra = () => {
  return apiClient.get('ordenes-compra/');
};

export const createOrdenCompra = (payload) => {
  return apiClient.post('ordenes-compra/', payload);
};

export const getPagosProveedores = () => {
  return apiClient.get('pagos-proveedores/');
};

export const createPagoProveedor = (payload) => {
  return apiClient.post('pagos-proveedores/', payload);
};

export const getMovimientosCliente = (clienteId, filters = {}) => {
  let url = `movimientos-clientes/?cliente_id=${clienteId}`;
  if (filters.fecha_inicio) url += `&fecha_inicio=${filters.fecha_inicio}`;
  if (filters.fecha_fin) url += `&fecha_fin=${filters.fecha_fin}`;
  return apiClient.get(url);
};

export const createAbono = (payload) => {
  return apiClient.post('movimientos-clientes/', payload);
};

export const getCalculoCorte = () => {
  return apiClient.get('cortes-caja/calcular-totales/');
};

export const createCorte = (payload) => {
  return apiClient.post('cortes-caja/', payload);
};

export const getCortesCaja = () => {
  return apiClient.get('cortes-caja/');
};

export const getReporteVentas = (fechaInicio, fechaFin) => {
  return apiClient.get(`ventas/reporte-ventas/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
};

export const getReporteExistencias = () => {
  return apiClient.get('productos/reporte-existencias/');
};

export const getSucursales = () => {
  return apiClient.get('sucursales/');
};

export const createTicketSuspendido = (payload) => {
  return apiClient.post('tickets-suspendidos/', payload);
};

export const getTicketSuspendidos = () => {
  return apiClient.get('tickets-suspendidos/');
};

export const deleteTicketSuspendido = (id) => {
  return apiClient.delete(`tickets-suspendidos/${id}/`);
};

export const exportarInventarioExcel = () => {
  return apiClient.get('reportes/exportar_inventario/', {
    responseType: 'blob',
  });
};

export const createRetiro = (payload) => {
  return apiClient.post('retiros/', payload);
};

export const getConfig = () => apiClient.get('configuracion/');
export const createConfig = (data) => apiClient.post('configuracion/', data);
export const updateConfig = (id, data) => apiClient.put(`configuracion/${id}/`, data);
export const purgeData = (payload) => apiClient.post('configuracion/purge-data/', payload);

export const getDescuentos = () => {
  return apiClient.get('descuentos/');
};

export const createDescuento = (payload) => {
  return apiClient.post('descuentos/', payload);
};

export const deleteDescuento = (id) => {
  return apiClient.delete(`descuentos/${id}/`);
};

export const getMe = () => {
  return apiClient.get('users/me/');
};

export const getInventario = (sucursalId, productoId) => {
    let url = 'inventario/?';
    if (sucursalId) url += `sucursal_id=${sucursalId}&`;
    if (productoId) url += `producto_id=${productoId}`;
    return apiClient.get(url);
};

export const getTransferencias = () => {
    return apiClient.get('transferencias/');
};

export const createTransferencia = (payload) => {
    return apiClient.post('transferencias/', payload);
};
