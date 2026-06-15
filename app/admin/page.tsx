'use client';

import { useState } from 'react';
import { DashboardView } from '@/views/DashboardView';
import { WebOrdersView } from '@/views/WebOrdersView';
import { InventoryPage } from '@/views/InventoryPage';
import { CategoriesView } from '@/views/CategoriesView';
import { SuppliersView } from '@/views/SuppliersView';
import { AdminPage } from '@/views/AdminPage';
import { PosPage } from '@/views/PosPage';
import { SalesHistoryView } from '@/views/SalesHistoryView';
import { VendorsView } from '@/views/VendorsView';
import { SettingsView } from '@/views/SettingsView';
import { WebContentManager } from '@/views/WebContentManager';

import { 
  LayoutDashboard, ShoppingBag, Package, Tag, Truck, BarChart2, 
  ShoppingCart, History, Users, Settings, Moon, Sun, LogOut, Globe
} from 'lucide-react';
import './App.css';

type Tab = 'dashboard' | 'web-orders' | 'inventory' | 'categories' | 'suppliers' | 'admin' | 'pos' | 'sales-history' | 'vendors' | 'settings' | 'web-content';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar sesión de la simulación?')) {
      alert('Sesión cerrada.');
    }
  };

  return (
    <div className={`app-layout-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Barra Lateral Izquierda (Aura Sidebar) */}
      <aside className="rofex-sidebar">
        <div className="sidebar-brand-block">
          <img 
            src="/logo.png" 
            alt="Aura Logo" 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              objectFit: 'contain',
              backgroundColor: '#111827', // Fondo oscuro para dar contraste en modo claro
              padding: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' 
            }} 
          />
          <strong style={{ marginLeft: '12px' }}>Aura</strong>
        </div>

        {/* Menú de Navegación */}
        <nav className="sidebar-nav-menu">
          <button 
            type="button"
            onClick={() => setActiveTab('dashboard')} 
            className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('web-orders')} 
            className={`sidebar-nav-btn ${activeTab === 'web-orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} />
            <span>Pedidos Web</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('inventory')} 
            className={`sidebar-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>Productos</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('categories')} 
            className={`sidebar-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
          >
            <Tag size={18} />
            <span>Categorías</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('suppliers')} 
            className={`sidebar-nav-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          >
            <Truck size={18} />
            <span>Proveedores</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('admin')} 
            className={`sidebar-nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            <span>Historial & Reportes</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('pos')} 
            className={`sidebar-nav-btn ${activeTab === 'pos' ? 'active' : ''}`}
          >
            <ShoppingCart size={18} />
            <span>Punto de Venta</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('sales-history')} 
            className={`sidebar-nav-btn ${activeTab === 'sales-history' ? 'active' : ''}`}
          >
            <History size={18} />
            <span>Historial Ventas</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('vendors')} 
            className={`sidebar-nav-btn ${activeTab === 'vendors' ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Vendedores</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('settings')} 
            className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('web-content')} 
            className={`sidebar-nav-btn ${activeTab === 'web-content' ? 'active' : ''}`}
          >
            <Globe size={18} />
            <span>Editar Web</span>
          </button>
        </nav>

        {/* Botón Salir */}
        <div className="sidebar-footer-exit">
          <button type="button" onClick={handleLogout} className="btn-exit-sidebar">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Panel de Contenido Principal (Derecha) */}
      <div className="main-content-wrapper">
        {/* Encabezado Superior (Top Bar) */}
        <header className="main-topbar">
          <div className="topbar-right-profile">
            <button 
              type="button" 
              onClick={() => setDarkMode(!darkMode)}
              className="btn-mode-toggle"
              aria-label="Alternar modo oscuro"
            >
              {darkMode ? <Sun size={18} className="text-yellow" /> : <Moon size={18} />}
            </button>
            <div className="profile-text-info">
              <span className="profile-username">Administrador</span>
              <span className="profile-user-role">Aura POS</span>
            </div>
            <div className="profile-avatar-circle" style={{ backgroundColor: '#10b981' }}>A</div>
          </div>
        </header>

        {/* Visualizador de Contenido según pestaña */}
        <main className="view-viewport-content">
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'web-orders' && <WebOrdersView />}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'suppliers' && <SuppliersView />}
          {activeTab === 'admin' && <AdminPage />}
          {activeTab === 'pos' && <PosPage />}
          {activeTab === 'sales-history' && <SalesHistoryView />}
          {activeTab === 'vendors' && <VendorsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'web-content' && <WebContentManager />}
        </main>
      </div>
    </div>
  );
}
