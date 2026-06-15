'use client';

import React, { useState, useEffect } from 'react';
import { dbService, type Order } from '@/services/supabase';
import { Calendar, Search, FileText, CheckCircle2, ChevronRight, X, ArrowLeft } from 'lucide-react';
import './SalesHistoryView.css';

export const SalesHistoryView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    try {
      const data = await dbService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = dbService.subscribeToOrders(() => loadOrders());
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sales-history-view-container animate-fade">
      <header className="history-view-header">
        <div className="header-title-block">
          <h2>Historial de Ventas</h2>
          <span className="subtitle-block">Listado completo de boletas y transacciones emitidas</span>
        </div>
      </header>

      <div className="history-toolbar">
        <div className="history-search-box">
          <Search className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por N° Ticket o método de pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="history-search-input"
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>N° Ticket</th>
              <th>Fecha y Hora</th>
              <th>Medio de Pago</th>
              <th className="text-center">Ítems</th>
              <th className="text-right">Monto Total</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.id}>
                <td><code className="ticket-code">#{o.id.substr(0, 8).toUpperCase()}</code></td>
                <td>
                  <div className="date-time-cell">
                    <Calendar size={12} />
                    <span>{new Date(o.created_at).toLocaleString('es-CL')}</span>
                  </div>
                </td>
                <td>
                  <span className={`payment-method-badge ${o.payment_method}`}>
                    {o.payment_method === 'cash' ? 'Efectivo' :
                     o.payment_method === 'debit' ? 'Débito' :
                     o.payment_method === 'credit' ? 'Crédito' : 'Transferencia'}
                  </span>
                </td>
                <td className="text-center">
                  {o.items?.length || 0}
                </td>
                <td className="text-right font-bold">
                  ${o.total_amount.toLocaleString('es-CL')}
                </td>
                <td className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setSelectedOrder(o)}
                    className="btn-secondary btn-sm btn-icon"
                  >
                    <FileText size={12} />
                    <span>Ver Boleta</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="no-data">
                  No se encontraron ventas en el historial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Boleta Térmica */}
      {selectedOrder && (
        <div className="pos-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="thermal-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-close-btn" onClick={() => setSelectedOrder(null)}>
              <X size={18} />
            </div>

            <div className="thermal-receipt-container">
              <div className="receipt-logo">Venta POS</div>
              <p className="receipt-address">Av. Providencia 1234, Santiago</p>
              <div className="receipt-dashed"></div>

              <div className="receipt-meta">
                <div>N° Ticket: <strong>{selectedOrder.id.substr(0, 8).toUpperCase()}</strong></div>
                <div>Fecha: {new Date(selectedOrder.created_at).toLocaleString('es-CL')}</div>
                <div>Forma de Pago: <strong>
                  {selectedOrder.payment_method === 'cash' ? 'EFECTIVO' : 
                   selectedOrder.payment_method === 'debit' ? 'DÉBITO' : 
                   selectedOrder.payment_method === 'credit' ? 'CRÉDITO' : 'TRANSFERENCIA'}
                </strong></div>
              </div>
              
              <div className="receipt-dashed"></div>

              <div className="receipt-items-list">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="receipt-item-line">
                    <div className="line-desc">{item.product?.name || 'Producto'}</div>
                    <div className="line-price-qty">
                      {item.product?.sell_type === 'weight' 
                        ? `${item.quantity} Kg x $${item.price.toLocaleString('es-CL')}/Kg`
                        : `${item.quantity} ud x $${item.price.toLocaleString('es-CL')}/ud`
                      }
                      <span>${Math.round(item.price * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="receipt-dashed"></div>

              <div className="receipt-total-block">
                <div className="receipt-total-line">
                  <span>TOTAL:</span>
                  <strong>${selectedOrder.total_amount.toLocaleString('es-CL')}</strong>
                </div>
              </div>

              <div className="receipt-dashed"></div>
              <p className="receipt-footer-msg">Copia de Historial Administrativo</p>
            </div>

            <button type="button" onClick={() => setSelectedOrder(null)} className="btn-secondary btn-block">
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
