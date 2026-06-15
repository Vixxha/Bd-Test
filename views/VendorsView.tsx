'use client';

import React, { useState } from 'react';
import { Plus, User, Shield, UserCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import './VendorsView.css';

interface Vendor {
  id: string;
  name: string;
  role: 'admin' | 'cashier';
  email: string;
  status: 'active' | 'inactive';
}

export const VendorsView: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: 'v-1', name: 'Felipe', role: 'admin', email: 'felipe@rofex.cl', status: 'active' },
    { id: 'v-2', name: 'Andrea Rojas', role: 'cashier', email: 'andrea.rojas@rofex.cl', status: 'active' },
    { id: 'v-3', name: 'Carlos Muñoz', role: 'cashier', email: 'carlos.munoz@rofex.cl', status: 'inactive' }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newVendor: Vendor = {
      id: 'v_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      status: 'active'
    };

    setVendors(prev => [...prev, newVendor]);
    setName('');
    setEmail('');
    setRole('cashier');
    setShowAddForm(false);
  };

  const toggleStatus = (id: string) => {
    setVendors(prev => prev.map(v => 
      v.id === id ? { ...v, status: v.status === 'active' ? 'inactive' : 'active' } : v
    ));
  };

  return (
    <div className="vendors-view-container animate-fade">
      <header className="vendors-view-header">
        <div className="header-title-block">
          <h2>Vendedores y Cajeros</h2>
          <span className="subtitle-block">Gestión de accesos y perfiles de venta para el local</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary btn-sm btn-icon"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Cerrar' : 'Agregar Vendedor'}</span>
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-vendor-form animate-down">
          <h3>Registrar Nuevo Vendedor</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="vendor-name">Nombre Completo *</label>
              <input 
                id="vendor-name"
                type="text" 
                placeholder="Ej: Andrea Rojas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="vendor-email">Email de Acceso *</label>
              <input 
                id="vendor-email"
                type="email" 
                placeholder="Ej: andrea@local.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="vendor-role">Rol de Sistema</label>
              <select 
                id="vendor-role"
                value={role} 
                onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
              >
                <option value="cashier">Cajero / Vendedor</option>
                <option value="admin">Administrador del Local (Acceso Completo)</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar Cajero</button>
          </div>
        </form>
      )}

      <div className="table-wrapper">
        <table className="vendors-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Cambiar Estado</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td className="user-name-cell">
                  <div className="avatar-circle-sm">
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <strong>{v.name}</strong>
                </td>
                <td>{v.email}</td>
                <td>
                  <span className={`role-badge ${v.role}`}>
                    {v.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                    {v.role === 'admin' ? 'Administrador' : 'Cajero'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={`status-badge ${v.status}`}>
                    {v.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    onClick={() => toggleStatus(v.id)}
                    className="btn-status-toggle"
                  >
                    {v.status === 'active' ? (
                      <ToggleRight size={24} className="text-emerald" />
                    ) : (
                      <ToggleLeft size={24} className="text-muted" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
