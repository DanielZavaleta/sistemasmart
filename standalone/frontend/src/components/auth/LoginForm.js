import React, { useState } from 'react';
import { login } from '../../services/apiService';

const LoginForm = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError('Error: Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="w-full max-w-xs">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-xl rounded-xl px-8 pt-6 pb-8 mb-4">

        <div className="flex justify-center mb-4">
          <img src="./Tech4Biss.png" alt="Logo" className="h-16 object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">Iniciar Sesión</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Usuario
          </label>
          <input
            className="shadow appearance-none border border-gray-200 rounded w-full py-2 px-3 bg-gray-50 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            className="shadow appearance-none border border-gray-200 rounded w-full py-2 px-3 bg-gray-50 text-gray-800 mb-4 leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full shadow-md transition-colors"
            type="submit"
          >
            Entrar
          </button>
        </div>

        {error && <p className="text-red-500 text-xs italic mt-4 text-center">{error}</p>}

      </form>
    </div>
  );
};

export default LoginForm;