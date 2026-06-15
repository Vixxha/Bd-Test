'use client';

import React, { useState } from 'react';
import { Plus, Truck, Phone, Mail, User } from 'lucide-react';
import './SuppliersView.css';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
}

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { 
      id: 'sup-1', 
      name: 'Distribuidora Frutos del Sur Ltda.', 
      contact: 'Juan Pérez', 
      phone: '+56 9 8888 7777', 
      email: 'contacto@frutosdelsur.cl', 
      category: 'Frutos Secos, Semillas' 
    },
    { 
      id: 'sup-2', 
      name: 'Envasados del Norte S.A.', 
      contact: 'Ana María', 
      phone: '+56 9 6666 5555', 
      email: 'abastecimiento@envasadosnorte.cl', 
      category: 'Aceites, Miel, Envasados' 
    },
    { 
      id: 'sup-3', 
      name: 'Avena y Cereales Centro S.A.', 
      contact: 'Ricardo Gómez', 
      phone: '+56 9 5555 4444', 
      email: 'rgomez@avenacentro.cl', 
      category: 'Harinas y Granos' 
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSup: Supplier = {
      id: 'sup_' + Math.random().toString(36).substr(2, 9),
      name,
      contact,
      phone,
      email,
      category
    };

    setSuppliers(prev => [...prev, newSup]);
    setName('');
    setContact('');
    setPhone('');
    setEmail('');
    setCategory('');
    setShowAddForm(false);
  };

  return (
    <div className="suppliers-view-container animate-fade">
      <header className="suppliers-view-header">
        <div className="header-title-block">
          <h2>Proveedores Mayoristas</h2>
          <span className="subtitle-block">Listado y contactos de distribuidores para abastecimiento del inventario</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary btn-sm btn-icon"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Cerrar' : 'Nuevo Proveedor'}</span>
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-supplier-form animate-down">
          <h3>Registrar Nuevo Proveedor</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sup-name">Razón Social / Nombre Comercial *</label>
              <input 
                id="sup-name"
                type="text" 
                placeholder="Ej: Distribuidora Frutos del Sur Ltda."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sup-contact">Persona de Contacto</label>
              <input 
                id="sup-contact"
                type="text" 
                placeholder="Ej: Juan Pérez"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sup-phone">Teléfono / Celular</label>
              <input 
                id="sup-phone"
                type="text" 
                placeholder="Ej: +56 9 8888 7777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sup-email">Email</label>
              <input 
                id="sup-email"
                type="email" 
                placeholder="Ej: contacto@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group col-span-2">
              <label htmlFor="sup-category">Categorías de Abastecimiento</label>
              <input 
                id="sup-category"
                type="text" 
                placeholder="Ej: Frutos Secos, Harinas, Aceites..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar Proveedor</button>
          </div>
        </form>
      )}

      <div className="table-wrapper">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Contacto</th>
              <th>Contacto Teléfono/Email</th>
              <th>Categorías de Abasto</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(sup => (
              <tr key={sup.id}>
                <td className="sup-name-cell">
                  <Truck size={14} className="text-emerald" />
                  <strong>{sup.name}</strong>
                </td>
                <td>
                  <div className="contact-person-cell">
                    <User size={12} />
                    <span>{sup.contact || 'No registrado'}</span>
                  </div>
                </td>
                <td>
                  <div className="contact-info-cell">
                    {sup.phone && <div className="info-line"><Phone size={10} /> <span>{sup.phone}</span></div>}
                    {sup.email && <div className="info-line"><Mail size={10} /> <span>{sup.email}</span></div>}
                  </div>
                </td>
                <td>
                  <span className="supplier-category-tags">
                    {sup.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
