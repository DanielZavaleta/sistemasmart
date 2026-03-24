import React, { useState, useEffect } from 'react';
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../../services/apiService';

const ProveedorForm = ({ selectedProveedor, onSave, onCancel }) => {
  const initialState = {
    rfc: '',
    razon_social: '',
    nombre_comercial: '',
    email: '',
    telefono: '',
  };
  const [proveedor, setProveedor] = useState(initialState);

  useEffect(() => {
    if (selectedProveedor) {
      setProveedor(selectedProveedor);
    } else {
      setProveedor(initialState);
    }
  }, [selectedProveedor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProveedor(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(proveedor);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-md p-4 rounded mb-4">
      <h3 className="text-xl text-white mb-4">{selectedProveedor ? 'Editar' : 'Crear'} Proveedor</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="rfc" value={proveedor.rfc} onChange={handleChange} placeholder="RFC (13 caracteres)" className="p-2 bg-gray-700 rounded" required maxLength="13" />
        <input name="razon_social" value={proveedor.razon_social} onChange={handleChange} placeholder="Razón Social (Nombre Fiscal)" className="p-2 bg-gray-700 rounded" required />
        <input name="nombre_comercial" value={proveedor.nombre_comercial} onChange={handleChange} placeholder="Nombre Comercial (Opcional)" className="p-2 bg-gray-700 rounded" />
        <input name="email" value={proveedor.email} onChange={handleChange} placeholder="Email (Opcional)" type="email" className="p-2 bg-gray-700 rounded" />
        <input name="telefono" value={proveedor.telefono} onChange={handleChange} placeholder="Teléfono (Opcional)" className="p-2 bg-gray-700 rounded" />
      </div>

      <div className="mt-6">
        <button type="submit" className="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mr-2">Guardar</button>
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
      </div>
    </form>
  );
};

const ProveedorManagement = () => {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [error, setError] = useState(null);

  const fetchProveedores = async () => {
    try {
      const response = await getProveedores();
      setProveedores(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar proveedores.');
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleSave = async (proveedor) => {
    try {
      if (selectedProveedor) {
        await updateProveedor(selectedProveedor.id, proveedor);
      } else {
        await createProveedor(proveedor);
      }
      setShowForm(false);
      setSelectedProveedor(null);
      fetchProveedores();
    } catch (err) {
      setError('Error al guardar el proveedor.');
    }
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await deleteProveedor(id);
        fetchProveedores();
      } catch (err) {
        setError('Error al eliminar el proveedor.');
      }
    }
  };

  return (
    <div className="w-full max-w-6xl p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Gestión de Proveedores</h2>
      {error && <p className="text-red-500 bg-red-200 p-2 rounded mb-4">{error}</p>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
          + Nuevo Proveedor
        </button>
      ) : (
        <ProveedorForm selectedProveedor={selectedProveedor} onSave={handleSave} onCancel={() => { setShowForm(false); setSelectedProveedor(null); }} />
      )}

      <div className="bg-white border border-gray-200 shadow-md rounded shadow-md overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4">RFC</th>
              <th className="p-4">Razón Social</th>
              <th className="p-4">Nombre Comercial</th>
              <th className="p-4">Email</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map(p => (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="p-4">{p.rfc}</td>
                <td className="p-4">{p.razon_social}</td>
                <td className="p-4">{p.nombre_comercial}</td>
                <td className="p-4">{p.email}</td>
                <td className="p-4">{p.telefono}</td>
                <td className="p-4">
                  <button onClick={() => handleEdit(p)} className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm font-bold py-1 px-2 rounded mr-2">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-2 rounded">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProveedorManagement;