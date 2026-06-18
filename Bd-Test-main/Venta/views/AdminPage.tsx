'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, CreditCard, DollarSign, BarChart2, ShieldAlert,
  ArrowRightLeft, Calendar, FileText, CheckCircle2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { dbService, type Order, type CashClosure, type Product } from '@/services/supabase';
import './AdminPage.css';

export const AdminPage: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Estados para el formulario de Arqueo Físico (Cierre de Caja)
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [arqueoCash, setArqueoCash] = useState('');
  const [arqueoDebit, setArqueoDebit] = useState('');
  const [arqueoCredit, setArqueoCredit] = useState('');
  const [arqueoTransfer, setArqueoTransfer] = useState('');
  const [closureSuccessMessage, setClosureSuccessMessage] = useState<string | null>(null);

  // Estado para expandir detalles de cierres históricos
  const [expandedClosureId, setExpandedClosureId] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [ordersData, closuresData, productsData] = await Promise.all([
        dbService.getActiveOrdersForClosure(),
        dbService.getCashClosures(),
        dbService.getProducts()
      ]);
      setActiveOrders(ordersData);
      setClosures(closuresData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error al cargar datos administrativos:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
    const unsubscribeOrders = dbService.subscribeToOrders(() => loadAdminData());
    const unsubscribeProducts = dbService.subscribeToProducts(() => loadAdminData());
    const unsubscribeClosures = dbService.subscribeToClosures(() => loadAdminData());

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeClosures();
    };
  }, []);

  // Calcular totales esperados del turno activo
  const totalsExpected = activeOrders.reduce(
    (acc, order) => {
      acc.sales_count += 1;
      acc.total_amount += order.total_amount;
      if (order.payment_method === 'cash') acc.cash_total += order.total_amount;
      if (order.payment_method === 'debit') acc.debit_total += order.total_amount;
      if (order.payment_method === 'credit') acc.credit_total += order.total_amount;
      if (order.payment_method === 'transfer') acc.transfer_total += order.total_amount;
      return acc;
    },
    {
      sales_count: 0,
      total_amount: 0,
      cash_total: 0,
      debit_total: 0,
      credit_total: 0,
      transfer_total: 0
    }
  );

  // Arqueo físico parseado
  const numArqueoCash = parseInt(arqueoCash, 10) || 0;
  const numArqueoDebit = parseInt(arqueoDebit, 10) || 0;
  const numArqueoCredit = parseInt(arqueoCredit, 10) || 0;
  const numArqueoTransfer = parseInt(arqueoTransfer, 10) || 0;
  const totalArqueado = numArqueoCash + numArqueoDebit + numArqueoCredit + numArqueoTransfer;

  const diffCash = numArqueoCash - totalsExpected.cash_total;
  const diffDebit = numArqueoDebit - totalsExpected.debit_total;
  const diffCredit = numArqueoCredit - totalsExpected.credit_total;
  const diffTransfer = numArqueoTransfer - totalsExpected.transfer_total;
  const diffTotal = totalArqueado - totalsExpected.total_amount;

  const handleCierreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeOrders.length === 0) {
      alert('No hay ventas activas para realizar un cierre.');
      return;
    }

    try {
      // Determinar la fecha de inicio del turno
      // Usar la fecha de la orden más antigua o la fecha actual
      const openedAt = activeOrders.length > 0 
        ? activeOrders[activeOrders.length - 1].created_at 
        : new Date().toISOString();

      await dbService.createCashClosure(openedAt, totalsExpected);
      
      setClosureSuccessMessage(`¡Cierre de caja registrado con éxito! Se archivaron ${totalsExpected.sales_count} ventas.`);
      setIsClosingOpen(false);
      setArqueoCash('');
      setArqueoDebit('');
      setArqueoCredit('');
      setArqueoTransfer('');
      
      setTimeout(() => {
        setClosureSuccessMessage(null);
      }, 5000);
      
      loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Error al realizar cierre.');
    }
  };

  // Alertas de Stock Bajo (Menos de 5 unidades o 5 Kg)
  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div className="admin-container">
      {closureSuccessMessage && (
        <div className="alert-success-banner">
          <CheckCircle2 size={18} />
          <span>{closureSuccessMessage}</span>
        </div>
      )}

      {/* Métricas del Turno Activo */}
      <section className="admin-section">
        <h3 className="section-title">Ventas del Turno Activo (Caja Abierta)</h3>
        <p className="section-desc">
          Resumen acumulado desde el último cierre de caja diario. Estas ventas no están archivadas todavía.
        </p>

        <div className="metrics-grid">
          <div className="admin-metric-card active-box">
            <div className="metric-header">
              <TrendingUp className="metric-icon" />
              <span>Ventas del Turno</span>
            </div>
            <strong>${totalsExpected.total_amount.toLocaleString('es-CL')}</strong>
            <span className="metric-sub">{totalsExpected.sales_count} transacciones</span>
          </div>

          <div className="admin-metric-card">
            <div className="metric-header">
              <DollarSign className="metric-icon text-orange" />
              <span>Efectivo Esperado</span>
            </div>
            <strong>${totalsExpected.cash_total.toLocaleString('es-CL')}</strong>
          </div>

          <div className="admin-metric-card">
            <div className="metric-header">
              <CreditCard className="metric-icon text-blue" />
              <span>Débito Esperado</span>
            </div>
            <strong>${totalsExpected.debit_total.toLocaleString('es-CL')}</strong>
          </div>

          <div className="admin-metric-card">
            <div className="metric-header">
              <CreditCard className="metric-icon text-indigo" />
              <span>Crédito Esperado</span>
            </div>
            <strong>${totalsExpected.credit_total.toLocaleString('es-CL')}</strong>
          </div>

          <div className="admin-metric-card">
            <div className="metric-header">
              <ArrowRightLeft className="metric-icon text-green" />
              <span>Transferencias</span>
            </div>
            <strong>${totalsExpected.transfer_total.toLocaleString('es-CL')}</strong>
          </div>
        </div>

        {activeOrders.length > 0 && !isClosingOpen && (
          <div className="closure-trigger-panel">
            <button 
              type="button" 
              onClick={() => setIsClosingOpen(true)} 
              className="btn-primary btn-icon"
            >
              <FileText size={16} />
              <span>Iniciar Arqueo y Cierre de Caja</span>
            </button>
          </div>
        )}
      </section>

      {/* Formulario/Panel de Arqueo Físico y Cierre */}
      {isClosingOpen && (
        <section className="admin-section arqueo-panel animate-down">
          <h3 className="section-title">Arqueo Físico de Caja</h3>
          <p className="section-desc">
            Cuenta el dinero en caja y los comprobantes de tarjetas para ingresarlos y verificar cuadratura.
          </p>

          <form onSubmit={handleCierreSubmit} className="arqueo-form">
            <div className="arqueo-inputs-grid">
              <div className="form-group">
                <label htmlFor="arqueo-cash-input">Efectivo Físico ($)</label>
                <input 
                  id="arqueo-cash-input"
                  type="number" 
                  placeholder="Ej: 10000"
                  value={arqueoCash}
                  onChange={(e) => setArqueoCash(e.target.value)}
                  required
                />
                <span className={`diff-tag ${diffCash === 0 ? 'ok' : diffCash > 0 ? 'surplus' : 'deficit'}`}>
                  Diferencia: {diffCash >= 0 ? `+$${diffCash.toLocaleString('es-CL')}` : `-$${Math.abs(diffCash).toLocaleString('es-CL')}`}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="arqueo-debit-input">Total Débito ($)</label>
                <input 
                  id="arqueo-debit-input"
                  type="number" 
                  placeholder="Ej: 15000"
                  value={arqueoDebit}
                  onChange={(e) => setArqueoDebit(e.target.value)}
                  required
                />
                <span className={`diff-tag ${diffDebit === 0 ? 'ok' : diffDebit > 0 ? 'surplus' : 'deficit'}`}>
                  Diferencia: {diffDebit >= 0 ? `+$${diffDebit.toLocaleString('es-CL')}` : `-$${Math.abs(diffDebit).toLocaleString('es-CL')}`}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="arqueo-credit-input">Total Crédito ($)</label>
                <input 
                  id="arqueo-credit-input"
                  type="number" 
                  placeholder="Ej: 20000"
                  value={arqueoCredit}
                  onChange={(e) => setArqueoCredit(e.target.value)}
                  required
                />
                <span className={`diff-tag ${diffCredit === 0 ? 'ok' : diffCredit > 0 ? 'surplus' : 'deficit'}`}>
                  Diferencia: {diffCredit >= 0 ? `+$${diffCredit.toLocaleString('es-CL')}` : `-$${Math.abs(diffCredit).toLocaleString('es-CL')}`}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="arqueo-transfer-input">Total Transferencias ($)</label>
                <input 
                  id="arqueo-transfer-input"
                  type="number" 
                  placeholder="Ej: 25000"
                  value={arqueoTransfer}
                  onChange={(e) => setArqueoTransfer(e.target.value)}
                  required
                />
                <span className={`diff-tag ${diffTransfer === 0 ? 'ok' : diffTransfer > 0 ? 'surplus' : 'deficit'}`}>
                  Diferencia: {diffTransfer >= 0 ? `+$${diffTransfer.toLocaleString('es-CL')}` : `-$${Math.abs(diffTransfer).toLocaleString('es-CL')}`}
                </span>
              </div>
            </div>

            <div className="arqueo-summary-card">
              <div className="summary-row">
                <span>Total Esperado en Libros:</span>
                <strong>${totalsExpected.total_amount.toLocaleString('es-CL')}</strong>
              </div>
              <div className="summary-row">
                <span>Total Contado Físicamente:</span>
                <strong>${totalArqueado.toLocaleString('es-CL')}</strong>
              </div>
              <div className="summary-row border-top">
                <span>Diferencia Total de Caja:</span>
                <strong className={`diff-val ${diffTotal === 0 ? 'ok' : diffTotal > 0 ? 'surplus' : 'deficit'}`}>
                  {diffTotal === 0 ? 'Cuadrado' : diffTotal > 0 ? `Sobrante: +$${diffTotal.toLocaleString('es-CL')}` : `Faltante: -$${Math.abs(diffTotal).toLocaleString('es-CL')}`}
                </strong>
              </div>
            </div>

            <div className="arqueo-actions">
              <button 
                type="button" 
                onClick={() => setIsClosingOpen(false)} 
                className="btn-secondary"
              >
                Cancelar Cierre
              </button>
              <button type="submit" className="btn-primary">
                Cerrar Caja y Guardar Jornada
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Grid Inferior: Alertas y Cierres Históricos */}
      <div className="admin-bottom-grid">
        {/* Alertas de Stock */}
        <section className="admin-section panel-alerts">
          <h3 className="section-title">
            <ShieldAlert size={18} className="icon-title text-orange" />
            Alertas de Stock Bajo
          </h3>
          <p className="section-desc">Productos envasados o a granel con niveles críticamente bajos.</p>

          <div className="alerts-list">
            {lowStockProducts.map(p => (
              <div key={p.id} className="alert-item">
                <div className="alert-info">
                  <strong>{p.name}</strong>
                  <span>SKU: {p.sku}</span>
                </div>
                <span className="alert-stock">
                  Quedan: <strong>{p.stock} {p.sell_type === 'weight' ? 'Kg' : 'uds'}</strong>
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="no-alerts">
                <CheckCircle2 className="icon-ok" size={24} />
                <p>Todos los niveles de inventario están correctos.</p>
              </div>
            )}
          </div>
        </section>

        {/* Historial de Cierres */}
        <section className="admin-section panel-history">
          <h3 className="section-title">
            <BarChart2 size={18} className="icon-title" />
            Historial de Cierres de Caja
          </h3>
          <p className="section-desc">Registro histórico de cuadratura de caja diaria.</p>

          <div className="closures-history-list">
            {closures.map(closure => {
              const isExpanded = expandedClosureId === closure.id;
              return (
                <div key={closure.id} className="closure-history-card">
                  <div 
                    className="closure-history-header"
                    onClick={() => setExpandedClosureId(isExpanded ? null : closure.id)}
                  >
                    <div className="ch-date">
                      <Calendar size={14} />
                      <span>{new Date(closure.closed_at).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="ch-total">
                      Total: <strong>${closure.total_amount.toLocaleString('es-CL')}</strong>
                    </div>
                    <div className="ch-toggle">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="closure-history-details animate-down">
                      <div className="ch-detail-grid">
                        <div className="ch-detail-row">
                          <span>Fecha Apertura:</span>
                          <span>{new Date(closure.opened_at).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="ch-detail-row">
                          <span>Ventas Registradas:</span>
                          <span>{closure.sales_count}</span>
                        </div>
                        <div className="ch-detail-row border-top">
                          <span>Efectivo Arqueado:</span>
                          <strong>${closure.cash_total.toLocaleString('es-CL')}</strong>
                        </div>
                        <div className="ch-detail-row">
                          <span>Débito Arqueado:</span>
                          <strong>${closure.debit_total.toLocaleString('es-CL')}</strong>
                        </div>
                        <div className="ch-detail-row">
                          <span>Crédito Arqueado:</span>
                          <strong>${closure.credit_total.toLocaleString('es-CL')}</strong>
                        </div>
                        <div className="ch-detail-row">
                          <span>Transferencias:</span>
                          <strong>${closure.transfer_total.toLocaleString('es-CL')}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {closures.length === 0 && (
              <div className="no-closures-msg">
                No hay cierres de caja guardados todavía. Realiza ventas y haz clic en "Cerrar Caja".
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
