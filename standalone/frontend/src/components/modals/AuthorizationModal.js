import React, { useState } from 'react';
import { authorizeAction } from '../../services/apiService';

const AuthorizationModal = ({ action, onAuthorized, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAuthorizing(true);

    try {
      const payload = {
        username: username,
        password: password,
        action: action,
      };

      const response = await authorizeAction(payload);

      setIsAuthorizing(false);
      onAuthorized(response.data);

    } catch (err) {
      setIsAuthorizing(false);
      if (err.response) {
        setError(err.response.data.error || 'Error de autorización');
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title">Autorización Requerida</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-3">
              Se requieren credenciales de supervisor para {action === 'cancel_ticket' ? 'cancelar el ticket' : 'esta acción'}.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isAuthorizing}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isAuthorizing}>
                  {isAuthorizing ? 'Autorizando...' : 'Autorizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorizationModal;