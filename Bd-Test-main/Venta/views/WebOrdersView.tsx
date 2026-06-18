'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, X, Phone, User, Clock, RefreshCw } from 'lucide-react';
import { dbService, type Order } from '@/services/supabase';
import './WebOrdersView.css';

export const WebOrdersView: React.FC = () => {
  const [webOrders, setWebOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWebOrders = async () => {
    try {
      const allOrders = await dbService.getOrders();
      // Filter orders placed online (those that have web analytics metadata)
      const onlineOrders = allOrders.filter(o => o.customer_name && o.customer_name !== 'POS Cliente');
      setWebOrders(onlineOrders);
    } catch (err) {
      console.error('Error loading web orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebOrders();
    const unsubscribe = dbService.subscribeToOrders(() => loadWebOrders());
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    if (window.confirm('¿Aprobar y despachar este pedido? Esto confirmará la venta y actualizará el estado.')) {
      try {
        await dbService.updateWebOrderStatus(id, 'completed');
        alert('Pedido aprobado con éxito.');
        loadWebOrders();
      } catch (err) {
        console.error(err);
        alert('Error al aprobar el pedido.');
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      try {
        await dbService.updateWebOrderStatus(id, 'cancelled');
        alert('Pedido cancelado.');
        loadWebOrders();
      } catch (err) {
        console.error(err);
        alert('Error al cancelar el pedido.');
      }
    }
  };

  const formatItemsString = (order: Order): string => {
    if (!order.items || order.items.length === 0) return 'Sin productos';
    return order.items.map(item => {
      const qty = item.quantity;
      const unit = item.product?.sell_type === 'weight' ? 'Kg' : 'ud';
      const name = item.product?.name || 'Producto';
      return `${qty} ${unit} de ${name}`;
    }).join(', ');
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} minutos`;
      
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} horas`;
      
      return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Fecha no disponible';
    }
  };

  if (loading) {
    return (
      <div className="web-orders-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
        <RefreshCw className="spinner" style={{ animation: 'spin 1s linear infinite', color: '#10b981', width: '32px', height: '32px' }} />
        <span>Sincronizando pedidos web en tiempo real...</span>
      </div>
    );
  }

  return (
    <div className="web-orders-view-container animate-fade">
      <header className="web-orders-view-header">
        <div className="header-title-block">
          <h2>Pedidos Web (Canales Online)</h2>
          <span className="subtitle-block">Ventas recibidas desde el Catálogo de Frutos Secos en tiempo real</span>
        </div>
      </header>

      {webOrders.length === 0 ? (
        <div className="empty-orders-state" style={{ textAlign: 'center', padding: '48px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', color: '#6b7280' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
          <h3>No hay pedidos web registrados</h3>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Las compras que realicen los clientes en la tienda online aparecerán aquí inmediatamente.</p>
        </div>
      ) : (
        <div className="web-orders-list">
          {webOrders.map(order => (
            <div key={order.id} className={`web-order-card ${order.status}`}>
              <div className="card-top-row">
                <div className="order-id-block">
                  <ShoppingBag size={16} />
                  <strong>{order.id.startsWith('ord_') ? order.id.substring(4).toUpperCase() : order.id}</strong>
                </div>
                <span className={`status-pill ${order.status}`}>
                  {order.status === 'pending' ? 'Pendiente por Aprobar' : 
                   order.status === 'completed' ? 'Despachado' : 'Cancelado'}
                </span>
              </div>

              <div className="card-middle-content">
                <div className="info-item">
                  <User size={14} />
                  <span>Cliente: <strong>{order.customer_name}</strong></span>
                </div>
                {order.customer_email && (
                  <div className="info-item" style={{ marginLeft: '18px', fontSize: '12px', color: '#6b7280', marginTop: '-4px' }}>
                    <span>Email: {order.customer_email}</span>
                  </div>
                )}
                <div className="info-item">
                  <Phone size={14} />
                  <span>WhatsApp: <a href={`https://wa.me/${order.customer_phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">{order.customer_phone}</a></span>
                </div>
                <div className="info-item">
                  <Clock size={14} />
                  <span>Pedido realizado: <span className="date-text">{formatRelativeTime(order.created_at)}</span></span>
                </div>
                {order.shipping_address && (
                  <div className="info-item" style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#4b5563' }}>Despacho: <strong>{order.shipping_address}, {order.shipping_city}</strong></span>
                  </div>
                )}
                
                <div className="order-items-summary">
                  <strong>Detalle de Compra:</strong>
                  <p>{formatItemsString(order)}</p>
                </div>
              </div>

              <div className="card-bottom-actions">
                <div className="order-total-block">
                  Total: <strong>${order.total_amount.toLocaleString('es-CL')}</strong>
                </div>
                
                {order.status === 'pending' && (
                  <div className="action-buttons-group">
                    <button 
                      type="button" 
                      onClick={() => handleCancel(order.id)}
                      className="btn-secondary btn-sm text-red-btn"
                    >
                      <X size={14} />
                      <span>Rechazar</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleApprove(order.id)}
                      className="btn-primary btn-sm btn-icon"
                    >
                      <Check size={14} />
                      <span>Aprobar y Despachar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
