'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, CreditCard, DollarSign, ArrowRight, 
  RotateCcw, Scale, Check, ShoppingBag, Plus, Minus 
} from 'lucide-react';
import { dbService, type Product } from '@/services/supabase';
import './PosPage.css';

interface TicketItem {
  product: Product;
  quantity: number; // Peso en kg o cantidad en unidades
}

export const PosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'weight' | 'unit'>('all');
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  
  // Estados para modal de peso (Granel)
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null);
  const [weightGrams, setWeightGrams] = useState<string>('');

  // Estados para flujo de pago
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'credit' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const loadProducts = async () => {
    try {
      const data = await dbService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
    const unsubscribe = dbService.subscribeToProducts(() => {
      loadProducts();
    });
    return () => unsubscribe();
  }, []);

  // Agregar al Ticket
  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0) return;

    if (product.sell_type === 'weight') {
      setSelectedProductForWeight(product);
      setWeightGrams('');
      setWeightModalOpen(true);
    } else {
      setTicket(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) return prev;
          return prev.map(item => 
            item.product.id === product.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prev, { product, quantity: 1 }];
        }
      });
    }
  };

  // Agregar producto a granel ingresando el peso
  const handleAddWeightProduct = () => {
    if (!selectedProductForWeight) return;
    const grams = parseFloat(weightGrams);
    if (isNaN(grams) || grams <= 0) return;

    const kg = grams / 1000;
    if (kg > selectedProductForWeight.stock) {
      alert(`No hay stock suficiente. Stock disponible: ${selectedProductForWeight.stock} Kg`);
      return;
    }

    setTicket(prev => {
      const existing = prev.find(item => item.product.id === selectedProductForWeight.id);
      if (existing) {
        const newKg = Math.min(selectedProductForWeight.stock, existing.quantity + kg);
        return prev.map(item => 
          item.product.id === selectedProductForWeight.id 
            ? { ...item, quantity: Number(newKg.toFixed(3)) }
            : item
        );
      } else {
        return [...prev, { product: selectedProductForWeight, quantity: Number(kg.toFixed(3)) }];
      }
    });

    setWeightModalOpen(false);
    setSelectedProductForWeight(null);
  };

  // Remover / Ajustar cantidades en el ticket
  const handleRemoveItem = (productId: string) => {
    setTicket(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleAdjustTicketQty = (productId: string, delta: number) => {
    setTicket(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Validar stock para unidades
          if (item.product.sell_type === 'unit' && newQty > item.product.stock) return item;
          // Validar stock para granel
          if (item.product.sell_type === 'weight' && newQty > item.product.stock) return item;
          return { ...item, quantity: Number(newQty.toFixed(3)) };
        }
        return item;
      }).filter((item): item is TicketItem => item !== null);
    });
  };

  const handleCancelTicket = () => {
    if (window.confirm('¿Seguro que deseas vaciar el ticket actual?')) {
      setTicket([]);
    }
  };

  // Procesar Venta
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket.length === 0) return;

    const itemsPayload = ticket.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }));

    try {
      const order = await dbService.createOrder(paymentMethod, itemsPayload);
      setSuccessReceipt({
        ...order,
        items: ticket
      });
      setTicket([]);
      setCheckoutOpen(false);
    } catch (err) {
      console.error('Error al registrar venta:', err);
      alert('Error registrando la venta.');
    }
  };

  const handleCloseReceipt = () => {
    setSuccessReceipt(null);
    setCashReceived('');
  };

  // Cálculos de ticket
  const ticketTotal = Math.round(
    ticket.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  const parsedCashReceived = parseInt(cashReceived.replace(/[^0-9]/g, ''), 10) || 0;
  const cashChange = parsedCashReceived > ticketTotal ? parsedCashReceived - ticketTotal : 0;

  // Filtrado de productos
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && p.sell_type === filterType;
  });

  // Botones de efectivo comunes en Chile
  const CHILEAN_BILLS = [1000, 2000, 5000, 10000, 20000];

  return (
    <div className="pos-container">
      {/* Columna Izquierda: Catálogo */}
      <div className="pos-catalog-column">
        <header className="pos-catalog-header">
          <div className="pos-search-box">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pos-search-input"
            />
          </div>

          <div className="pos-filter-buttons">
            <button 
              type="button" 
              onClick={() => setFilterType('all')} 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            >
              Todos
            </button>
            <button 
              type="button" 
              onClick={() => setFilterType('weight')} 
              className={`filter-tab ${filterType === 'weight' ? 'active' : ''}`}
            >
              A Granel (Peso)
            </button>
            <button 
              type="button" 
              onClick={() => setFilterType('unit')} 
              className={`filter-tab ${filterType === 'unit' ? 'active' : ''}`}
            >
              Envasados (Unidades)
            </button>
          </div>
        </header>

        <div className="pos-products-grid">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            return (
              <div 
                key={product.id} 
                onClick={() => handleProductSelect(product)}
                className={`pos-product-card ${isOutOfStock ? 'out' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', padding: '12px' }}
              >
                <div className="pos-card-image-wrapper" style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4', borderRadius: '12px', overflow: 'hidden' }}>
                  {product.image_url && (product.image_url.startsWith('data:image/') || product.image_url.startsWith('http') || product.image_url.startsWith('/')) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    // Elegant preset color badge or placeholder representing categories
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#4a5568' }}>
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1 }}>
                  <div className="pos-card-sku">{product.sku}</div>
                  <h4 className="pos-card-name" style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>{product.name}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: '6px' }}>
                  <div className="pos-card-price" style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#2d6a4f' }}>
                    ${product.price.toLocaleString('es-CL')}
                    <span className="unit-label">/{product.sell_type === 'weight' ? 'Kg' : 'Ud'}</span>
                  </div>
                </div>
                <div className="pos-card-stock" style={{ fontSize: '10px', color: '#666' }}>
                  Stock: {product.stock} {product.sell_type === 'weight' ? 'Kg' : 'uds'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Ticket de Venta */}
      <div className="pos-ticket-column">
        <div className="ticket-header">
          <ShoppingCart size={18} />
          <h3>Ticket de Venta</h3>
          {ticket.length > 0 && <span className="ticket-count">{ticket.length}</span>}
        </div>

        <div className="ticket-items-area">
          {ticket.length === 0 ? (
            <div className="ticket-empty">
              <ShoppingBag size={40} className="text-muted" />
              <p>El ticket está vacío. Selecciona productos del catálogo.</p>
            </div>
          ) : (
            <div className="ticket-items-list">
              {ticket.map((item, index) => (
                <div key={index} className="ticket-item-row animate-row">
                  <div className="item-main">
                    <span className="item-name">{item.product.name}</span>
                    <span className="item-sub">
                      {item.product.sell_type === 'weight' 
                        ? `${item.quantity} Kg x $${item.product.price.toLocaleString('es-CL')}/Kg`
                        : `${item.quantity} ud x $${item.product.price.toLocaleString('es-CL')}/ud`
                      }
                    </span>
                  </div>

                  <div className="item-actions-panel">
                    <div className="item-qty-selector">
                      <button 
                        type="button" 
                        onClick={() => handleAdjustTicketQty(item.product.id, item.product.sell_type === 'weight' ? -0.1 : -1)}
                        className="qty-btn"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="qty-val">
                        {item.product.sell_type === 'weight' ? `${item.quantity} kg` : item.quantity}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleAdjustTicketQty(item.product.id, item.product.sell_type === 'weight' ? 0.1 : 1)}
                        className="qty-btn"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <span className="item-subtotal">
                      ${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}
                    </span>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="btn-trash-item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ticket.length > 0 && (
          <div className="ticket-footer-panel">
            <div className="ticket-total-row">
              <span>Total a Cobrar</span>
              <strong>${ticketTotal.toLocaleString('es-CL')}</strong>
            </div>

            <div className="ticket-action-buttons">
              <button 
                type="button" 
                onClick={handleCancelTicket} 
                className="btn-secondary btn-icon"
              >
                <RotateCcw size={16} />
                <span>Cancelar</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setCheckoutOpen(true);
                  setPaymentMethod('cash');
                  setCashReceived('');
                }} 
                className="btn-primary btn-icon btn-pay"
              >
                <CreditCard size={16} />
                <span>Cobrar</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ingresar peso (Venta a Granel) */}
      {weightModalOpen && selectedProductForWeight && (
        <div className="pos-modal-backdrop">
          <div className="weight-modal-card">
            <div className="weight-modal-header">
              <Scale size={20} className="text-primary" />
              <h3>Venta a Granel (Pesaje)</h3>
            </div>
            
            <div className="weight-modal-body">
              <p className="weight-product-info">
                <strong>{selectedProductForWeight.name}</strong> <br />
                Precio por Kilogramo: ${selectedProductForWeight.price.toLocaleString('es-CL')}/Kg <br />
                Stock disponible: {selectedProductForWeight.stock} Kg
              </p>

              <div className="weight-input-group">
                <label htmlFor="weight-input-grams">Gramos a Vender</label>
                <div className="input-with-suffix">
                  <input 
                    id="weight-input-grams"
                    type="number" 
                    placeholder="Ej: 250, 500, 1000"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    autoFocus
                  />
                  <span>gramos</span>
                </div>
                {weightGrams && !isNaN(parseFloat(weightGrams)) && (
                  <span className="weight-equivalent-label">
                    Equivale a: <strong>{(parseFloat(weightGrams) / 1000).toFixed(3)} Kg</strong> - Valor: <strong>${Math.round((selectedProductForWeight.price * parseFloat(weightGrams)) / 1000).toLocaleString('es-CL')}</strong>
                  </span>
                )}
              </div>

              {/* Botones de atajo rápido de peso */}
              <div className="weight-shortcuts">
                <button type="button" onClick={() => setWeightGrams('100')} className="btn-secondary btn-sm">100g</button>
                <button type="button" onClick={() => setWeightGrams('250')} className="btn-secondary btn-sm">250g</button>
                <button type="button" onClick={() => setWeightGrams('500')} className="btn-secondary btn-sm">500g</button>
                <button type="button" onClick={() => setWeightGrams('1000')} className="btn-secondary btn-sm">1 Kg (1000g)</button>
              </div>
            </div>

            <div className="weight-modal-actions">
              <button 
                type="button" 
                onClick={() => { setWeightModalOpen(false); setSelectedProductForWeight(null); }} 
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleAddWeightProduct}
                className="btn-primary"
                disabled={!weightGrams || isNaN(parseFloat(weightGrams)) || parseFloat(weightGrams) <= 0}
              >
                Agregar al Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Cobro */}
      {checkoutOpen && (
        <div className="pos-modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="checkout-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header-title">
              <h3>Confirmar Cobro</h3>
              <span>Total: ${ticketTotal.toLocaleString('es-CL')}</span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="drawer-payment-form">
              <div className="payment-methods-grid">
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('cash')}
                  className={`pm-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                >
                  <DollarSign size={18} />
                  <span>Efectivo</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('debit')}
                  className={`pm-btn ${paymentMethod === 'debit' ? 'active' : ''}`}
                >
                  <CreditCard size={18} />
                  <span>Débito</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('credit')}
                  className={`pm-btn ${paymentMethod === 'credit' ? 'active' : ''}`}
                >
                  <CreditCard size={18} />
                  <span>Crédito</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod('transfer')}
                  className={`pm-btn ${paymentMethod === 'transfer' ? 'active' : ''}`}
                >
                  <RotateCcw size={18} />
                  <span>Transferencia</span>
                </button>
              </div>

              {/* Sección exclusiva para Pago en Efectivo */}
              {paymentMethod === 'cash' && (
                <div className="cash-payment-section">
                  <div className="form-group">
                    <label htmlFor="cash-received-input">Efectivo Recibido</label>
                    <input 
                      id="cash-received-input"
                      type="text" 
                      placeholder="Ej: 20000"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9]/g, ''))}
                      className="cash-input"
                      autoFocus
                    />
                  </div>

                  {/* Botones rápidos de billetes */}
                  <div className="chilean-bills-grid">
                    {CHILEAN_BILLS.map(bill => (
                      <button 
                        key={bill}
                        type="button"
                        onClick={() => setCashReceived(bill.toString())}
                        className="bill-btn"
                      >
                        ${bill.toLocaleString('es-CL')}
                      </button>
                    ))}
                  </div>

                  {parsedCashReceived > 0 && (
                    <div className="vuelto-display-card">
                      <span>Vuelto a Entregar:</span>
                      <strong className={cashChange >= 0 ? 'vuelto-green' : 'vuelto-red'}>
                        {cashChange >= 0 ? `$${cashChange.toLocaleString('es-CL')}` : 'Monto insuficiente'}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="drawer-actions">
                <button 
                  type="button" 
                  onClick={() => setCheckoutOpen(false)} 
                  className="btn-secondary"
                >
                  Volver
                </button>
                <button 
                  type="submit" 
                  className="btn-primary btn-checkout-confirm"
                  disabled={paymentMethod === 'cash' && parsedCashReceived < ticketTotal}
                >
                  <Check size={16} />
                  <span>Registrar Venta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recibo Térmico de Venta Exitosa */}
      {successReceipt && (
        <div className="pos-modal-backdrop">
          <div className="thermal-receipt-card">
            <div className="thermal-receipt-container">
              <div className="receipt-logo">Venta POS</div>
              <p className="receipt-address">Av. Providencia 1234, Santiago</p>
              <div className="receipt-dashed"></div>

              <div className="receipt-meta">
                <div>N° Ticket: <strong>{successReceipt.id.substr(0, 8).toUpperCase()}</strong></div>
                <div>Fecha: {new Date(successReceipt.created_at).toLocaleString('es-CL')}</div>
                <div>Forma de Pago: <strong>
                  {successReceipt.payment_method === 'cash' ? 'EFECTIVO' : 
                   successReceipt.payment_method === 'debit' ? 'DÉBITO' : 
                   successReceipt.payment_method === 'credit' ? 'CRÉDITO' : 'TRANSFERENCIA'}
                </strong></div>
              </div>
              
              <div className="receipt-dashed"></div>

              <div className="receipt-items-list">
                {successReceipt.items?.map((item: any, idx: number) => (
                  <div key={idx} className="receipt-item-line">
                    <div className="line-desc">{item.product.name}</div>
                    <div className="line-price-qty">
                      {item.product.sell_type === 'weight' 
                        ? `${item.quantity} Kg x $${item.product.price.toLocaleString('es-CL')}/Kg`
                        : `${item.quantity} ud x $${item.product.price.toLocaleString('es-CL')}/ud`
                      }
                      <span>${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="receipt-dashed"></div>

              <div className="receipt-total-block">
                <div className="receipt-total-line">
                  <span>TOTAL:</span>
                  <strong>${successReceipt.total_amount.toLocaleString('es-CL')}</strong>
                </div>
                {successReceipt.payment_method === 'cash' && parsedCashReceived > 0 && (
                  <>
                    <div className="receipt-sub-line">
                      <span>PAGÓ CON:</span>
                      <span>${parsedCashReceived.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="receipt-sub-line">
                      <span>VUELTO:</span>
                      <span>${cashChange.toLocaleString('es-CL')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="receipt-dashed"></div>
              <p className="receipt-footer-msg">¡Gracias por su compra!</p>
            </div>

            <button type="button" onClick={handleCloseReceipt} className="btn-primary btn-block btn-receipt-close">
              Iniciar Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
