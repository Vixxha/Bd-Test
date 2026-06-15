'use client';

import React, { useState } from 'react';
import { Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import './SettingsView.css';

export const SettingsView: React.FC = () => {
  const [storeName, setStoreName] = useState('Aura Boutique');
  const [storeAddress, setStoreAddress] = useState('Av. Providencia 1234, Santiago');
  const [storePhone, setStorePhone] = useState('+56 9 1234 5678');
  const [profitMargin, setProfitMargin] = useState('53.5');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDb = () => {
    if (window.confirm('¿Seguro que deseas restablecer la base de datos local? Esto borrará todos los productos, ventas y cierres creados, dejando el sistema completamente vacío y listo para una carga limpia.')) {
      setResetting(true);
      localStorage.clear();
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="settings-view-container animate-fade">
      <header className="settings-view-header">
        <div className="header-title-block">
          <h2>Configuración del Sistema</h2>
          <span className="subtitle-block">Ajustes generales del punto de venta y restablecimiento de simulación</span>
        </div>
      </header>

      {saveSuccess && (
        <div className="alert-success-banner">
          <CheckCircle2 size={18} />
          <span>Configuración guardada exitosamente en el navegador.</span>
        </div>
      )}

      <div className="settings-grid">
        {/* Formulario de Configuración del Local */}
        <section className="settings-section">
          <h3>Datos del Local y Facturación</h3>
          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="set-store-name">Nombre Comercial</label>
              <input 
                id="set-store-name"
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="set-store-address">Dirección Física (Boleta)</label>
              <input 
                id="set-store-address"
                type="text" 
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="set-store-phone">Teléfono de Contacto</label>
              <input 
                id="set-store-phone"
                type="text" 
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="set-profit-margin">Margen de Utilidad Estimado (%)</label>
              <div className="input-with-suffix">
                <input 
                  id="set-profit-margin"
                  type="number" 
                  step="0.1"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(e.target.value)}
                  required
                />
                <span>%</span>
              </div>
              <span className="form-hint">Este valor se utiliza en el Dashboard para proyectar la utilidad aproximada sobre las ventas brutas.</span>
            </div>

            <button type="submit" className="btn-primary btn-icon">
              <Save size={16} />
              <span>Guardar Configuración</span>
            </button>
          </form>
        </section>

        {/* Sección de Mantenimiento / Reset */}
        <section className="settings-section reset-section">
          <h3>Mantenimiento de Prototipo</h3>
          <p>
            Esta aplicación se ejecuta en **Modo Prototipo Local** utilizando el almacenamiento interno del navegador (`localStorage`).
          </p>
          <div className="reset-actions-card">
            <p className="reset-warning-text">
              ⚠️ Al restablecer la base de datos, se eliminarán todos los productos creados manualmente, las ventas registradas y los arqueos de caja del navegador, volviendo al estado de semilla inicial (base de datos completamente vacía y lista para importación).
            </p>
            <button 
              type="button" 
              onClick={handleResetDb} 
              className="btn-danger btn-icon"
              disabled={resetting}
            >
              <RefreshCw className={resetting ? 'spinner' : ''} size={16} />
              <span>{resetting ? 'Restableciendo...' : 'Restablecer Base de Datos Local'}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
