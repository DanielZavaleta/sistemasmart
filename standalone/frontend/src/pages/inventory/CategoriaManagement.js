import React, { useState, useEffect } from 'react';
import {
  getFamilias, createFamilia, updateFamilia, deleteFamilia,
  getSubfamilias, createSubfamilia, updateSubfamilia, deleteSubfamilia
} from '../../services/apiService';

const SimpleForm = ({ item, onSave, onCancel, fields }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const initialState = fields.reduce((acc, field) => {
      acc[field.name] = item ? item[field.name] : field.default || '';
      return acc;
    }, { id: item ? item.id : null });
    setFormData(initialState);
  }, [item, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded mb-4">
      {fields.map(field => (
        <div key={field.name} className="mb-2">
          <label className="block text-gray-300 text-sm mb-1">{field.label}</label>
          {field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="p-2 bg-gray-600 rounded w-full"
            >
              <option value="">{field.placeholder}</option>
              {field.options.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.nombre}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              className="p-2 bg-gray-600 rounded w-full"
            />
          )}
        </div>
      ))}
      <div className="mt-4">
        <button type="submit" className="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mr-2">Guardar</button>
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancelar</button>
      </div>
    </form>
  );
};

const CategoriaManagement = () => {
  const [familias, setFamilias] = useState([]);
  const [subfamilias, setSubfamilias] = useState([]);
  const [editingFamilia, setEditingFamilia] = useState(null);
  const [editingSubfamilia, setEditingSubfamilia] = useState(null);
  const [showFamiliaForm, setShowFamiliaForm] = useState(false);
  const [showSubfamiliaForm, setShowSubfamiliaForm] = useState(false);

  const loadData = async () => {
    const famRes = await getFamilias();
    setFamilias(famRes.data);
    const subRes = await getSubfamilias();
    setSubfamilias(subRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);


  const handleSaveFamilia = async (familia) => {
    if (familia.id) {
      await updateFamilia(familia.id, familia);
    } else {
      await createFamilia(familia);
    }
    setShowFamiliaForm(false);
    setEditingFamilia(null);
    loadData();
  };
  const handleDeleteFamilia = async (id) => {
    if (window.confirm('¿Eliminar Familia? Esto eliminará sus subfamilias.')) {
      await deleteFamilia(id);
      loadData();
    }
  };


  const handleSaveSubfamilia = async (subfamilia) => {

    const dataToSend = { nombre: subfamilia.nombre, familia: subfamilia.familia };
    if (subfamilia.id) {
      await updateSubfamilia(subfamilia.id, dataToSend);
    } else {
      await createSubfamilia(dataToSend);
    }
    setShowSubfamiliaForm(false);
    setEditingSubfamilia(null);
    loadData();
  };
  const handleDeleteSubfamilia = async (id) => {
    if (window.confirm('¿Eliminar Subfamilia?')) {
      await deleteSubfamilia(id);
      loadData();
    }
  };

  return (
    <div className="w-full max-w-6xl p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Familias</h2>
        {!showFamiliaForm ? (
          <button onClick={() => { setShowFamiliaForm(true); setEditingFamilia(null); }} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
            + Nueva Familia
          </button>
        ) : (
          <SimpleForm
            item={editingFamilia}
            onSave={handleSaveFamilia}
            onCancel={() => setShowFamiliaForm(false)}
            fields={[
              { name: 'nombre', label: 'Nombre Familia', placeholder: 'Ej: Bebidas' }
            ]}
          />
        )}
        <div className="bg-gray-800 rounded shadow-md">
          {familias.map(f => (
            <div key={f.id} className="flex justify-between items-center p-3 border-b border-gray-700">
              <span className="text-white">{f.nombre}</span>
              <div>
                <button onClick={() => { setEditingFamilia(f); setShowFamiliaForm(true); }} className="bg-yellow-500 text-sm py-1 px-2 rounded mr-2">Editar</button>
                <button onClick={() => handleDeleteFamilia(f.id)} className="bg-red-500 text-sm py-1 px-2 rounded">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Subfamilias</h2>
        {!showSubfamiliaForm ? (
          <button onClick={() => { setShowSubfamiliaForm(true); setEditingSubfamilia(null); }} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4">
            + Nueva Subfamilia
          </button>
        ) : (
          <SimpleForm
            item={editingSubfamilia}
            onSave={handleSaveSubfamilia}
            onCancel={() => setShowSubfamiliaForm(false)}
            fields={[
              { name: 'familia', label: 'Familia', type: 'select', options: familias, placeholder: 'Seleccione una familia' },
              { name: 'nombre', label: 'Nombre Subfamilia', placeholder: 'Ej: Refrescos' }
            ]}
          />
        )}
        <div className="bg-gray-800 rounded shadow-md">
          {subfamilias.map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 border-b border-gray-700">
              <div>
                <span className="text-white">{s.nombre}</span>
                <span className="text-xs text-cyan-400 block">{s.familia_nombre}</span>
              </div>
              <div>
                <button onClick={() => { setEditingSubfamilia({ ...s, familia: s.familia }); setShowSubfamiliaForm(true); }} className="bg-yellow-500 text-sm py-1 px-2 rounded mr-2">Editar</button>
                <button onClick={() => handleDeleteSubfamilia(s.id)} className="bg-red-500 text-sm py-1 px-2 rounded">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriaManagement;