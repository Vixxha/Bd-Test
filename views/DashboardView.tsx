'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, FileText, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { dbService, type Order, type Product } from '@/services/supabase';
import './DashboardView.css';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

type TimeRange = 'hoy' | 'semana' | 'mes' | 'anio';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [range, setRange] = useState<TimeRange>('anio');
  
  // Tooltip del gráfico SVG
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const loadData = async () => {
    try {
      const [allOrders, allProducts] = await Promise.all([
        dbService.getOrders(),
        dbService.getProducts()
      ]);
      setOrders(allOrders);
      setProducts(allProducts);
    } catch (err) {
      console.error('Error al cargar datos de dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubOrders = dbService.subscribeToOrders(() => loadData());
    const unsubProducts = dbService.subscribeToProducts(() => loadData());
    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  // Filtrar órdenes por rango
  const filterOrdersByRange = (items: Order[], selectedRange: TimeRange) => {
    const now = new Date();
    return items.filter(o => {
      const date = new Date(o.created_at);
      if (selectedRange === 'hoy') {
        return date.toDateString() === now.toDateString();
      }
      if (selectedRange === 'semana') {
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (selectedRange === 'mes') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      // Año (Default)
      return date.getFullYear() === now.getFullYear();
    });
  };

  const activeOrders = filterOrdersByRange(orders, range);

  // Calcular métricas
  const totalSales = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalTickets = activeOrders.length;
  const netUtility = Math.round(totalSales * 0.535); // Margen del 53.5%
  const criticalStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const soldOutStockCount = products.filter(p => p.stock <= 0).length;

  // Rango para mostrar en etiquetas
  const getRangeLabel = () => {
    if (range === 'hoy') return 'HOY';
    if (range === 'semana') return 'ESTA SEMANA';
    if (range === 'mes') return 'ESTE MES';
    return 'ESTE AÑO';
  };

  // Agrupar datos por mes para el gráfico anual (o por días para rangos más cortos)
  const getChartData = () => {
    if (range === 'hoy') {
      const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
      const hourlyData = hours.map((hour, idx) => {
        const matchingOrders = activeOrders.filter(o => {
          const h = new Date(o.created_at).getHours();
          const start = 9 + idx * 2;
          return h >= start && h < start + 2;
        });
        const sales = matchingOrders.reduce((sum, o) => sum + o.total_amount, 0);
        return { label: hour, value: sales };
      });
      return hourlyData;
    }

    if (range === 'semana') {
      const days = ['Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb', 'Dom'];
      return days.map((day, idx) => {
        const matchingOrders = activeOrders.filter(o => {
          const d = new Date(o.created_at).getDay();
          const mappedDay = d === 0 ? 6 : d - 1;
          return mappedDay === idx;
        });
        const sales = matchingOrders.reduce((sum, o) => sum + o.total_amount, 0);
        return { label: day, value: sales };
      });
    }

    if (range === 'mes') {
      const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
      return weeks.map((week, idx) => {
        const matchingOrders = activeOrders.filter(o => {
          const day = new Date(o.created_at).getDate();
          const wIdx = Math.min(3, Math.floor((day - 1) / 7));
          return wIdx === idx;
        });
        const sales = matchingOrders.reduce((sum, o) => sum + o.total_amount, 0);
        return { label: week, value: sales };
      });
    }

    // Default: Año (agrupar por meses Ene-Jun de 2026)
    const months = [
      { label: '01/2026', value: 0 },
      { label: '02/2026', value: 0 },
      { label: '03/2026', value: 0 },
      { label: '04/2026', value: 0 },
      { label: '05/2026', value: 0 },
      { label: '06/2026', value: 0 }
    ];

    orders.forEach(o => {
      const d = new Date(o.created_at);
      if (d.getFullYear() === 2026) {
        const mIdx = d.getMonth();
        if (mIdx < months.length) {
          months[mIdx].value += o.total_amount;
        }
      }
    });

    return months;
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000);

  // Calcular las coordenadas SVG del gráfico de área
  const width = 800;
  const height = 180;
  const paddingX = 50;
  const paddingY = 20;

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx * (width - 2 * paddingX)) / (chartData.length - 1);
    const y = height - paddingY - (d.value / maxChartValue) * (height - 2 * paddingY);
    return { x, y, label: d.label, value: d.value };
  });

  // Generar el path SVG
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  }

  return (
    <div className="dashboard-view-container animate-fade">
      {/* Título de Sección y Selector de Rango */}
      <header className="dashboard-view-header">
        <div className="header-title-block">
          <h2>Resumen de Ventas</h2>
          <span className="subtitle-block">Mostrando datos de: <strong>{getRangeLabel()}</strong></span>
        </div>

        <div className="range-selector-tabs">
          <button 
            type="button" 
            onClick={() => setRange('hoy')}
            className={`range-tab ${range === 'hoy' ? 'active' : ''}`}
          >
            Hoy
          </button>
          <button 
            type="button" 
            onClick={() => setRange('semana')}
            className={`range-tab ${range === 'semana' ? 'active' : ''}`}
          >
            Esta Semana
          </button>
          <button 
            type="button" 
            onClick={() => setRange('mes')}
            className={`range-tab ${range === 'mes' ? 'active' : ''}`}
          >
            Este Mes
          </button>
          <button 
            type="button" 
            onClick={() => setRange('anio')}
            className={`range-tab ${range === 'anio' ? 'active' : ''}`}
          >
            Este Año
          </button>
        </div>
      </header>

      {/* Grilla de Métricas en Tarjetas */}
      <div className="metrics-summary-grid">
        <div className="metric-summary-card hover-card" onClick={() => onNavigate('sales-history')}>
          <div className="metric-card-top">
            <span className="card-label">VENTAS DE: {getRangeLabel()}</span>
            <DollarSign className="card-icon icon-emerald" size={18} />
          </div>
          <strong className="card-value">${totalSales.toLocaleString('es-CL')}</strong>
          <span className="card-link-btn">
            <span>Ver detalle</span>
            <ArrowRight size={12} />
          </span>
        </div>

        <div className="metric-summary-card">
          <div className="metric-card-top">
            <span className="card-label">UTILIDAD NETA (APROX) DE: {getRangeLabel()}</span>
            <TrendingUp className="card-icon icon-yellow" size={18} />
          </div>
          <strong className="card-value utility-color">${netUtility.toLocaleString('es-CL')}</strong>
          <span className="card-sub-info">Margen: 53,5%</span>
        </div>

        <div className="metric-summary-card hover-card" onClick={() => onNavigate('inventory')}>
          <div className="metric-card-top">
            <span className="card-label">INVENTARIO CRÍTICO / AGOTADO</span>
            <ShieldAlert className="card-icon icon-red" size={18} />
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginTop: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e53e3e' }}>{criticalStockCount} <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'normal' }}>Críticos</span></span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#718096' }}>{soldOutStockCount} <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'normal' }}>Agotados</span></span>
          </div>
          <span className="card-link-btn" style={{ marginTop: '8px' }}>
            <span>Ajustar stock</span>
            <ArrowRight size={12} />
          </span>
        </div>

        <div className="metric-summary-card hover-card" onClick={() => onNavigate('sales-history')}>
          <div className="metric-card-top">
            <span className="card-label">TICKETS EMITIDOS DE: {getRangeLabel()}</span>
            <FileText className="card-icon icon-blue" size={18} />
          </div>
          <strong className="card-value text-blue-card">#{totalTickets}</strong>
          <span className="card-link-btn">
            <span>Ver lista</span>
            <ArrowRight size={12} />
          </span>
        </div>
      </div>

      {/* Gráfico Tendencia de Ventas (SVG curvo interactivo) */}
      <div className="chart-wrapper-card">
        <div className="chart-card-header">
          <h3>Tendencia de Ventas</h3>
          <span className="period-label">Periodo: {getRangeLabel()}</span>
        </div>

        <div className="svg-container-relative">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="sales-curve-svg">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Líneas horizontales de fondo */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(0,0,0,0.05)" />

            {/* Dibujar área sombreada */}
            {areaD && <path d={areaD} fill="url(#areaGrad)" />}

            {/* Dibujar línea principal */}
            {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Dibujar puntos de datos */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="5" 
                  fill="#ffffff" 
                  stroke="#3b82f6" 
                  strokeWidth="3"
                  className="chart-data-circle"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </svg>

          {/* Tooltip dinámico sobre el gráfico */}
          {hoveredPoint && (
            <div 
              className="chart-tooltip animate-fade"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 32}%`
              }}
            >
              <div className="tooltip-label">{hoveredPoint.label}</div>
              <div className="tooltip-value">${hoveredPoint.value.toLocaleString('es-CL')}</div>
            </div>
          )}
        </div>

        {/* Eje X Etiquetas */}
        <div className="chart-x-axis">
          {chartData.map((d, idx) => (
            <span key={idx} className="x-label-item">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
