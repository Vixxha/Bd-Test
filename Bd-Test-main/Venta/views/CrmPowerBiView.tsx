'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, FileSpreadsheet, BarChart2, Settings, Upload, RefreshCw, 
  AlertTriangle, CheckCircle, TrendingUp, DollarSign, Activity, Filter, 
  ArrowRight, Search, Copy, ExternalLink, Calendar, Users, ShoppingBag,
  Check, X, AlertCircle, Info, ChevronRight, MapPin, Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbService, type Order } from '@/services/supabase';
import './CrmPowerBiView.css';

// Interfaces
interface CrmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  channel: string;
  date: string;
}

interface ReconciliationItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  crmAmount: number;
  posAmount: number;
  status: 'exact' | 'discrepancy' | 'missing_pos' | 'missing_crm';
  channel: string;
  date: string;
  ignored?: boolean;
}

type Tab = 'reconcile' | 'dashboard' | 'integration';
type PbiSubTab = 'overview' | 'pareo' | 'details';

export const CrmPowerBiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reconcile');
  const [pbiTab, setPbiTab] = useState<PbiSubTab>('overview');
  
  // Estados de datos principales
  const [orders, setOrders] = useState<Order[]>([]);
  const [crmRecords, setCrmRecords] = useState<CrmRecord[]>([]);
  const [reconciledItems, setReconciledItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  
  // Reglas de pareo configurables
  const [matchEmail, setMatchEmail] = useState(true);
  const [matchPhone, setMatchPhone] = useState(true);
  const [matchName, setMatchName] = useState(false);
  const [tolerance, setTolerance] = useState(100); // Tolerancia en pesos para considerar "exacto"

  // Buscador y filtros visuales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exact' | 'discrepancy' | 'missing_pos' | 'missing_crm'>('all');
  
  // Cajón lateral de detalles para resolución
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);

  // Estados para filtros del Power BI Dashboard
  const [pbiChannel, setPbiChannel] = useState<'all' | 'pos' | 'web'>('all');
  const [pbiDateRange, setPbiDateRange] = useState<'all' | 'last7' | 'last30'>('all');
  const [pbiPayment, setPbiPayment] = useState<'all' | 'cash' | 'card' | 'transfer'>('all');
  
  // Comuna activa seleccionada en el mapa geográfico
  const [activeCommune, setActiveCommune] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar órdenes reales al montar
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const realOrders = await dbService.getOrders();
        if (realOrders.length === 0) {
          setOrders(getMockOrders());
        } else {
          setOrders(realOrders);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders(getMockOrders());
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Generar datos ficticios de CRM
  const handleGenerateCrmMock = () => {
    setLoading(true);
    setTimeout(() => {
      const mockCrm: CrmRecord[] = [
        { id: 'CRM-101', name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '+56912345678', amount: 24000, channel: 'Web', date: '2026-06-15T14:30:00Z' },
        { id: 'CRM-102', name: 'María López', email: 'maria.l@example.com', phone: '+56987654321', amount: 15000, channel: 'Web', date: '2026-06-16T18:15:00Z' }, // Discrepancia
        { id: 'CRM-103', name: 'Pedro Soto', email: 'pedrosoto@gmail.com', phone: '+56955551111', amount: 9500, channel: 'Directo', date: '2026-06-14T11:00:00Z' },
        { id: 'CRM-104', name: 'Ana Silva', email: 'ana.silva@example.com', phone: '+56999998888', amount: 32000, channel: 'Web', date: '2026-06-17T09:45:00Z' }, // Falta en POS
        { id: 'CRM-105', name: 'Diego Torres', email: 'diego.t@hotmail.com', phone: '+56944443333', amount: 12500, channel: 'Directo', date: '2026-06-13T16:20:00Z' },
        { id: 'CRM-106', name: 'Francisca Vial', email: 'fran.vial@example.com', phone: '+56933332222', amount: 4890, channel: 'Web', date: '2026-06-18T10:00:00Z' },
        { id: 'CRM-107', name: 'Roberto Muñoz', email: 'rober.m@example.com', phone: '+56977776666', amount: 11990, channel: 'Web', date: '2026-06-12T15:30:00Z' }, // Discrepancia
        { id: 'CRM-108', name: 'Camila Rojas', email: 'camila.rojas@gmail.com', phone: '+56966665555', amount: 18000, channel: 'Directo', date: '2026-06-11T13:10:00Z' } // Falta en POS
      ];
      setCrmRecords(mockCrm);
      setLoading(false);
    }, 400);
  };

  // Procesar archivo cargado
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (evt) => {
      try {
        let records: CrmRecord[] = [];
        if (extension === 'xlsx' || extension === 'xls') {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          records = jsonData.map((row, idx) => ({
            id: row.ID || row.id || row.Id || `CRM-FILE-${idx + 1}`,
            name: row.Nombre || row.nombre || row.Name || row.name || 'Cliente Desconocido',
            email: row.Email || row.email || row.Correo || row.correo || '',
            phone: String(row.Telefono || row.telefono || row.Phone || row.phone || ''),
            amount: Number(row.Monto || row.monto || row.Amount || row.amount || 0),
            channel: row.Canal || row.canal || row.Channel || row.channel || 'CRM Importado',
            date: row.Fecha || row.fecha || row.Date || row.date || new Date().toISOString()
          }));
        } else {
          const text = evt.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length > 1) {
            const separator = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
            
            const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name') || h.includes('cliente'));
            const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo') || h.includes('mail'));
            const phoneIdx = headers.findIndex(h => h.includes('telefono') || h.includes('phone') || h.includes('tel'));
            const amountIdx = headers.findIndex(h => h.includes('monto') || h.includes('amount') || h.includes('total'));
            const channelIdx = headers.findIndex(h => h.includes('canal') || h.includes('channel') || h.includes('origen'));
            const dateIdx = headers.findIndex(h => h.includes('fecha') || h.includes('date'));

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
              if (values.length < 2) continue;
              records.push({
                id: `CRM-CSV-${i}`,
                name: nameIdx !== -1 ? values[nameIdx] : `Cliente CSV ${i}`,
                email: emailIdx !== -1 ? values[emailIdx] : '',
                phone: phoneIdx !== -1 ? values[phoneIdx] : '',
                amount: amountIdx !== -1 ? parseFloat(values[amountIdx].replace(/[^0-9.-]/g, '')) || 0 : 0,
                channel: channelIdx !== -1 ? values[channelIdx] : 'CRM CSV',
                date: dateIdx !== -1 ? values[dateIdx] : new Date().toISOString()
              });
            }
          }
        }

        if (records.length > 0) {
          setCrmRecords(records);
        } else {
          alert('No se pudieron extraer registros válidos del archivo.');
        }
      } catch (err) {
        console.error('Error al procesar archivo:', err);
        alert('Ocurrió un error al procesar el archivo. Revisa el formato.');
      } finally {
        setLoading(false);
      }
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Algoritmo de Conciliación
  const runReconciliation = () => {
    if (crmRecords.length === 0) return;
    setReconciling(true);

    setTimeout(() => {
      const items: ReconciliationItem[] = [];
      const matchedCrmIds = new Set<string>();
      const matchedPosIds = new Set<string>();

      const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '');

      // Cruce desde CRM
      crmRecords.forEach(crm => {
        const matchedOrder = orders.find(order => {
          const emailMatch = matchEmail && crm.email && order.customer_email && crm.email.toLowerCase() === order.customer_email.toLowerCase();
          const phoneMatch = matchPhone && crm.phone && order.customer_phone && cleanPhone(crm.phone).slice(-8) === cleanPhone(order.customer_phone).slice(-8);
          const nameMatch = matchName && crm.name && order.customer_name && crm.name.toLowerCase().trim() === order.customer_name.toLowerCase().trim();
          return emailMatch || phoneMatch || nameMatch;
        });

        if (matchedOrder) {
          matchedCrmIds.add(crm.id);
          matchedPosIds.add(matchedOrder.id);

          const diff = Math.abs(crm.amount - matchedOrder.total_amount);
          const isExact = diff <= tolerance;
          
          items.push({
            id: crm.id,
            name: crm.name,
            email: crm.email || matchedOrder.customer_email || '',
            phone: crm.phone || matchedOrder.customer_phone || '',
            crmAmount: crm.amount,
            posAmount: matchedOrder.total_amount,
            status: isExact ? 'exact' : 'discrepancy',
            channel: matchedOrder.customer_name === 'POS Cliente' ? 'POS' : 'Web',
            date: matchedOrder.created_at
          });
        } else {
          items.push({
            id: crm.id,
            name: crm.name,
            email: crm.email,
            phone: crm.phone,
            crmAmount: crm.amount,
            posAmount: 0,
            status: 'missing_pos',
            channel: crm.channel,
            date: crm.date
          });
        }
      });

      // Huérfanos POS
      orders.forEach(order => {
        if (matchedPosIds.has(order.id)) return;
        
        items.push({
          id: order.id,
          name: order.customer_name || 'Cliente POS Anónimo',
          email: order.customer_email || '',
          phone: order.customer_phone || '',
          crmAmount: 0,
          posAmount: order.total_amount,
          status: 'missing_crm',
          channel: order.customer_name === 'POS Cliente' ? 'POS' : 'Web',
          date: order.created_at
        });
      });

      setReconciledItems(items);
      setReconciling(false);
    }, 400);
  };

  // Re-ejecutar cuando cambian datos o reglas
  useEffect(() => {
    if (crmRecords.length > 0) {
      runReconciliation();
    }
  }, [crmRecords, orders, matchEmail, matchPhone, matchName, tolerance]);

  // Limpiar
  const handleClear = () => {
    setCrmRecords([]);
    setReconciledItems([]);
    setSelectedItem(null);
  };

  // =========================================================
  // ACCIONES INTERACTIVAS DEL CAJÓN DE DETALLES (RESOLUCIÓN)
  // =========================================================
  
  // Acción A: Corregir Monto en POS/Sistema Local (Sincronizar hacia CRM)
  const handleSyncToCrm = (item: ReconciliationItem) => {
    // Simulamos la actualización en la lista de órdenes locales
    setOrders(prev => prev.map(o => {
      if (o.id === item.id || (o.customer_email === item.email && item.email !== '')) {
        return { ...o, total_amount: item.crmAmount };
      }
      return o;
    }));
    alert('Monto en las órdenes de ventas corregido. Se igualó al registro de CRM.');
    setSelectedItem(null);
  };

  // Acción B: Corregir Monto en CRM (Sincronizar hacia POS)
  const handleSyncToPos = (item: ReconciliationItem) => {
    // Simulamos la actualización en los registros de CRM
    setCrmRecords(prev => prev.map(c => {
      if (c.id === item.id) {
        return { ...c, amount: item.posAmount };
      }
      return c;
    }));
    alert('Monto en la base del CRM corregido. Se igualó al valor de venta del POS.');
    setSelectedItem(null);
  };

  // Acción C: Generar pedido POS faltante (Para registros que solo están en CRM)
  const handleCreateMissingOrder = (item: ReconciliationItem) => {
    const newOrder: Order = {
      id: `ord_web_${Date.now().toString().slice(-4)}`,
      total_amount: item.crmAmount,
      payment_method: 'transfer',
      created_at: new Date().toISOString(),
      closure_id: null,
      customer_name: item.name,
      customer_email: item.email,
      customer_phone: item.phone,
      shipping_address: 'Por registrar',
      shipping_city: 'Santiago',
      status: 'completed'
    };

    setOrders(prev => [newOrder, ...prev]);
    alert(`Se creó una orden de venta por $${item.crmAmount.toLocaleString('es-CL')} vinculada al cliente ${item.name}.`);
    setSelectedItem(null);
  };

  // Acción D: Registrar cliente en CRM (Para ventas que no estaban registradas en el CRM)
  const handleCreateCrmRecord = (item: ReconciliationItem) => {
    const newCrm: CrmRecord = {
      id: `CRM-${Date.now().toString().slice(-4)}`,
      name: item.name,
      email: item.email || `${item.name.toLowerCase().replace(/\s/g, '')}@cfs-imported.cl`,
      phone: item.phone || '+56900000000',
      amount: item.posAmount,
      channel: item.channel,
      date: item.date
    };

    setCrmRecords(prev => [...prev, newCrm]);
    alert(`Cliente "${item.name}" registrado en la base de CRM con volumen comercial de $${item.posAmount.toLocaleString('es-CL')}.`);
    setSelectedItem(null);
  };

  // Acción E: Ignorar o archivar este descuadre
  const handleIgnoreItem = (item: ReconciliationItem) => {
    setReconciledItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return { ...i, ignored: true };
      }
      return i;
    }));
    setSelectedItem(null);
  };

  // Generar Excel Avanzado multi-hoja
  const handleExportExcel = () => {
    if (reconciledItems.length === 0) return;

    try {
      const stats = getReconcileStats();
      const wsSummaryData = [
        ['RECONCILIACIÓN Y PAREO DE INFORMACIÓN CRM VS POS/WEB'],
        ['Fecha de Reporte:', new Date().toLocaleString('es-CL')],
        [],
        ['Métrica de Conciliación', 'Cantidad de Casos', 'Monto Involucrado ($)'],
        ['Total Registros en CRM', stats.totalCrm, stats.totalCrmAmount],
        ['Total Órdenes en POS/Web', stats.totalPos, stats.totalPosAmount],
        ['Coincidencias Exactas (Cuadradas)', stats.exactCount, stats.exactAmount],
        ['Discrepancias en Montos', stats.discrepancyCount, stats.discrepancyAmount],
        ['Huérfanos CRM (Falta en POS/Ventas)', stats.missingPosCount, stats.missingPosAmount],
        ['Huérfanos Ventas (Falta en CRM)', stats.missingCrmCount, stats.missingCrmAmount],
        [],
        ['Reglas de Cruce Aplicadas:', `Email: ${matchEmail ? 'SI' : 'NO'} | Teléfono: ${matchPhone ? 'SI' : 'NO'} | Nombre: ${matchName ? 'SI' : 'NO'} | Tolerancia: $${tolerance}`]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);

      const matchedData = reconciledItems
        .filter(i => (i.status === 'exact' || i.status === 'discrepancy') && !i.ignored)
        .map(i => ({
          'ID CRM': i.id,
          'Nombre Cliente': i.name,
          'Email': i.email,
          'Teléfono': i.phone,
          'Monto CRM ($)': i.crmAmount,
          'Monto POS/Web ($)': i.posAmount,
          'Diferencia ($)': i.crmAmount - i.posAmount,
          'Canal Venta': i.channel,
          'Fecha Transacción': new Date(i.date).toLocaleString('es-CL'),
          'Estado': i.status === 'exact' ? 'Cuadrado Exacto' : 'Discrepancia en Monto'
        }));
      const wsMatched = XLSX.utils.json_to_sheet(matchedData);

      const missingPosData = reconciledItems
        .filter(i => i.status === 'missing_pos' && !i.ignored)
        .map(i => ({
          'ID CRM': i.id,
          'Nombre Lead': i.name,
          'Email': i.email,
          'Teléfono': i.phone,
          'Monto Potencial CRM ($)': i.crmAmount,
          'Canal CRM': i.channel,
          'Fecha Registro CRM': new Date(i.date).toLocaleString('es-CL')
        }));
      const wsMissingPos = XLSX.utils.json_to_sheet(missingPosData);

      const missingCrmData = reconciledItems
        .filter(i => i.status === 'missing_crm' && !i.ignored)
        .map(i => ({
          'ID Venta (POS)': i.id,
          'Nombre Cliente': i.name,
          'Email': i.email,
          'Teléfono': i.phone,
          'Monto Cobrado ($)': i.posAmount,
          'Canal Venta': i.channel,
          'Fecha Venta': new Date(i.date).toLocaleString('es-CL' )
        }));
      const wsMissingCrm = XLSX.utils.json_to_sheet(missingCrmData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Conciliacion');
      XLSX.utils.book_append_sheet(wb, wsMatched, 'Ventas Match CRM');
      XLSX.utils.book_append_sheet(wb, wsMissingPos, 'Huérfanos CRM (Sin POS)');
      XLSX.utils.book_append_sheet(wb, wsMissingCrm, 'Huérfanos POS (Sin CRM)');

      wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }];

      XLSX.writeFile(wb, `Reporte_Conciliacion_CRM_PRO_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el Excel.');
    }
  };

  // Estadísticas globales
  const getReconcileStats = () => {
    const activeItems = reconciledItems.filter(i => !i.ignored);
    const totalCrm = crmRecords.length;
    const totalPos = orders.length;
    const totalCrmAmount = crmRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalPosAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);

    const exactCount = activeItems.filter(i => i.status === 'exact').length;
    const exactAmount = activeItems.filter(i => i.status === 'exact').reduce((sum, i) => sum + i.posAmount, 0);

    const discrepancyCount = activeItems.filter(i => i.status === 'discrepancy').length;
    const discrepancyAmount = activeItems.filter(i => i.status === 'discrepancy').reduce((sum, i) => sum + i.posAmount, 0);

    const missingPosCount = activeItems.filter(i => i.status === 'missing_pos').length;
    const missingPosAmount = activeItems.filter(i => i.status === 'missing_pos').reduce((sum, i) => sum + i.crmAmount, 0);

    const missingCrmCount = activeItems.filter(i => i.status === 'missing_crm').length;
    const missingCrmAmount = activeItems.filter(i => i.status === 'missing_crm').reduce((sum, i) => sum + i.posAmount, 0);

    return {
      totalCrm, totalPos, totalCrmAmount, totalPosAmount,
      exactCount, exactAmount,
      discrepancyCount, discrepancyAmount,
      missingPosCount, missingPosAmount,
      missingCrmCount, missingCrmAmount
    };
  };

  const reconcileStats = getReconcileStats();

  // Filtrado de tabla
  const getFilteredItems = () => {
    return reconciledItems.filter(item => {
      if (item.ignored) return false;
      const matchSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  // --- FILTROS DE POWER BI SIMULADO ---
  const getFilteredOrders = () => {
    return orders.filter(order => {
      if (pbiChannel === 'pos' && order.customer_name !== 'POS Cliente') return false;
      if (pbiChannel === 'web' && order.customer_name === 'POS Cliente') return false;

      if (pbiPayment === 'cash' && order.payment_method !== 'cash') return false;
      if (pbiPayment === 'card' && order.payment_method !== 'debit' && order.payment_method !== 'credit') return false;
      if (pbiPayment === 'transfer' && order.payment_method !== 'transfer') return false;

      const orderDate = new Date(order.created_at);
      const diffDays = (new Date().getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
      if (pbiDateRange === 'last7' && diffDays > 7) return false;
      if (pbiDateRange === 'last30' && diffDays > 30) return false;

      return true;
    });
  };

  const getPbiKpiMetrics = () => {
    const filtered = getFilteredOrders();
    const totalAmount = filtered.reduce((sum, o) => sum + o.total_amount, 0);
    const count = filtered.length;
    const ticketPromedio = count > 0 ? Math.round(totalAmount / count) : 0;
    
    const stats = getReconcileStats();
    const totalCruce = stats.exactCount + stats.discrepancyCount;
    const crmMatchRate = stats.totalCrm > 0 ? Math.round((totalCruce / stats.totalCrm) * 100) : 85;

    return { totalAmount, count, ticketPromedio, crmMatchRate };
  };

  const pbiMetrics = getPbiKpiMetrics();
  const activeFilteredOrders = getFilteredOrders();

  return (
    <div className="crm-powerbi-container">
      {/* HEADER DE MÓDULO */}
      <header className="crm-pbi-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>CRM & Analítica Power BI</h2>
            <p className="subtitle">Extracción, cuadratura de planillas avanzadas (Pareo) y analítica de datos comerciales en tiempo real</p>
          </div>
          {reconciledItems.length > 0 && (
            <button 
              onClick={handleExportExcel}
              className="btn-primary btn-icon"
              style={{ backgroundColor: '#10b981', fontSize: '0.85rem', alignSelf: 'flex-start' }}
            >
              <FileSpreadsheet size={16} />
              <span>Descargar Planilla Pro (.xlsx)</span>
            </button>
          )}
        </div>
        
        {/* Pestañas Principales */}
        <div className="crm-tabs">
          <button 
            onClick={() => setActiveTab('reconcile')} 
            className={`crm-tab-btn ${activeTab === 'reconcile' ? 'active' : ''}`}
          >
            <RefreshCw size={15} />
            <span>1. Conciliación CRM & Ventas</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`crm-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <BarChart2 size={15} />
            <span>2. Tablero Power BI (Simulación)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('integration')} 
            className={`crm-tab-btn ${activeTab === 'integration' ? 'active' : ''}`}
          >
            <Database size={15} />
            <span>3. Conexión e Integración Power BI</span>
          </button>
        </div>
      </header>

      {/* RENDER TAB CONTENIDO */}
      <div className="crm-tab-content">
        
        {/* PESTAÑA 1: CONCILIACIÓN */}
        {activeTab === 'reconcile' && (
          <div className="reconciliation-grid">
            
            {/* Lado Izquierdo: Configuración e Importación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Card 1: Importador */}
              <div className="importer-card">
                <h3>Cargar Base CRM</h3>
                <div 
                  className="dropzone-crm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                  <Upload className="icon" size={28} />
                  <p>Arrastra tu archivo o haz clic</p>
                  <span>Soporta .xlsx, .xls, .csv</span>
                </div>

                <div className="or-divider">O</div>

                <button 
                  type="button" 
                  onClick={handleGenerateCrmMock}
                  className="btn-secondary btn-simulate"
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="spinner" size={14} /> : <Users size={14} style={{ marginRight: '8px' }} />}
                  Cargar Datos de Simulación
                </button>

                {crmRecords.length > 0 && (
                  <button 
                    type="button" 
                    onClick={handleClear}
                    className="btn-exit-sidebar"
                    style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '10px' }}
                  >
                    Limpiar Filtros y Datos
                  </button>
                )}
              </div>

              {/* Card 2: Reglas de Mapeo */}
              <div className="importer-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} className="text-primary" />
                  <h3 style={{ fontSize: '0.92rem' }}>Reglas de Pareo</h3>
                </div>
                
                <div className="rules-panel">
                  <h4>Campos de Cruce</h4>
                  <label className="rule-item">
                    <input 
                      type="checkbox" 
                      checked={matchEmail} 
                      onChange={(e) => setMatchEmail(e.target.checked)} 
                    />
                    <span>Contrastar por Correo</span>
                  </label>
                  <label className="rule-item">
                    <input 
                      type="checkbox" 
                      checked={matchPhone} 
                      onChange={(e) => setMatchPhone(e.target.checked)} 
                    />
                    <span>Contrastar por Teléfono</span>
                  </label>
                  <label className="rule-item">
                    <input 
                      type="checkbox" 
                      checked={matchName} 
                      onChange={(e) => setMatchName(e.target.checked)} 
                    />
                    <span>Contrastar por Nombre</span>
                  </label>

                  <div className="rule-input-group">
                    <label>Tolerancia Monto Cobrado ($)</label>
                    <input 
                      type="number" 
                      className="rule-input"
                      value={tolerance}
                      onChange={(e) => setTolerance(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Ej: 100"
                    />
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Diferencia tolerada para estado "Cuadrado"</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Lado Derecho: Tabla de Pareo */}
            <div className="results-card">
              <div className="results-header-row">
                <div>
                  <h3>Cuadratura de Planilla & Cruce CRM</h3>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    {reconciledItems.length > 0 
                      ? `Cruces calculados: ${reconciledItems.filter(i => !i.ignored).length} casos. Haz clic en una fila para resolver descuadres.`
                      : 'Módulo listo. Importa datos para ejecutar el pareo y resolver discrepancias.'}
                  </span>
                </div>
              </div>

              {reconciledItems.length > 0 ? (
                <>
                  {/* Stats Cards */}
                  <div className="reconcile-stats-row">
                    <div className="reconcile-stat-card stat-green">
                      <span>Exacto (Cuadrado)</span>
                      <strong>{reconcileStats.exactCount}</strong>
                    </div>
                    <div className="reconcile-stat-card stat-orange">
                      <span>Descuadre Monto</span>
                      <strong>{reconcileStats.discrepancyCount}</strong>
                    </div>
                    <div className="reconcile-stat-card stat-blue">
                      <span>Sin POS (Solo CRM)</span>
                      <strong>{reconcileStats.missingPosCount}</strong>
                    </div>
                    <div className="reconcile-stat-card stat-red">
                      <span>Sin CRM (Solo POS)</span>
                      <strong>{reconcileStats.missingCrmCount}</strong>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="filter-tags-row">
                      <button 
                        onClick={() => setStatusFilter('all')} 
                        className={`filter-tag-btn ${statusFilter === 'all' ? 'active' : ''}`}
                      >
                        Todos ({reconciledItems.filter(i => !i.ignored).length})
                      </button>
                      <button 
                        onClick={() => setStatusFilter('exact')} 
                        className={`filter-tag-btn ${statusFilter === 'exact' ? 'active' : ''}`}
                      >
                        Cuadrados ({reconcileStats.exactCount})
                      </button>
                      <button 
                        onClick={() => setStatusFilter('discrepancy')} 
                        className={`filter-tag-btn ${statusFilter === 'discrepancy' ? 'active' : ''}`}
                      >
                        Descuadrados ({reconcileStats.discrepancyCount})
                      </button>
                      <button 
                        onClick={() => setStatusFilter('missing_pos')} 
                        className={`filter-tag-btn ${statusFilter === 'missing_pos' ? 'active' : ''}`}
                      >
                        Falta en Ventas ({reconcileStats.missingPosCount})
                      </button>
                      <button 
                        onClick={() => setStatusFilter('missing_crm')} 
                        className={`filter-tag-btn ${statusFilter === 'missing_crm' ? 'active' : ''}`}
                      >
                        Falta en CRM ({reconcileStats.missingCrmCount})
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '20px', width: '220px', border: '1px solid #e5e7eb' }}>
                      <Search size={14} style={{ color: '#9ca3af', marginRight: '8px' }} />
                      <input 
                        type="text" 
                        placeholder="Buscar por cliente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.78rem', width: '100%', color: '#374151' }}
                      />
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="reconcile-table">
                      <thead>
                        <tr>
                          <th>Cliente / ID</th>
                          <th>Contacto</th>
                          <th>Canal</th>
                          <th style={{ textAlign: 'right' }}>CRM</th>
                          <th style={{ textAlign: 'right' }}>POS / Web</th>
                          <th style={{ textAlign: 'right' }}>Diferencia</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredItems().map((item, idx) => {
                          const diff = item.crmAmount - item.posAmount;
                          return (
                            <tr key={idx} onClick={() => setSelectedItem(item)}>
                              <td>
                                <strong style={{ display: 'block', color: '#111827' }}>{item.name}</strong>
                                <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{item.id}</span>
                              </td>
                              <td>
                                <div className="phone-email-block">
                                  <span>{item.email}</span>
                                  <span>{item.phone}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{item.channel}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                {item.crmAmount > 0 ? `$${item.crmAmount.toLocaleString('es-CL')}` : '-'}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                {item.posAmount > 0 ? `$${item.posAmount.toLocaleString('es-CL')}` : '-'}
                              </td>
                              <td style={{ textAlign: 'right' }} className={`diff-amount ${Math.abs(diff) <= tolerance ? 'zero' : diff > 0 ? 'positive' : 'negative'}`}>
                                {Math.abs(diff) <= tolerance ? '$0' : diff > 0 ? `+$${diff.toLocaleString('es-CL')}` : `-$${Math.abs(diff).toLocaleString('es-CL')}`}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`match-status-badge ${item.status}`}>
                                  {item.status === 'exact' && 'Cuadrado'}
                                  {item.status === 'discrepancy' && 'Descuadrado'}
                                  {item.status === 'missing_pos' && 'Falta en Ventas'}
                                  {item.status === 'missing_crm' && 'Falta en CRM'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {getFilteredItems().length === 0 && (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                              No hay registros que coincidan con la búsqueda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FileSpreadsheet size={44} style={{ color: '#d1d5db' }} />
                  <h4>Cargar Base CRM</h4>
                  <p style={{ maxWidth: '400px', fontSize: '0.8rem', margin: 0 }}>
                    Para activar la cuadratura inteligente de planillas de venta, carga un archivo de CRM externo o presiona "Cargar Datos de Simulación".
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PESTAÑA 2: VISUALIZADOR POWER BI */}
        {activeTab === 'dashboard' && (
          <div className="pbi-iframe-simulator">
            {/* Top Bar Power BI */}
            <div className="pbi-toolbar-top">
              <div className="pbi-logo-label">
                <div className="pbi-logo-icon-svg"></div>
                <span>Microsoft Power BI</span>
              </div>
              <div className="pbi-report-title">
                <strong>Chile Frutos Secos - Reporte de Cuadratura y CRM Analytics</strong>
              </div>
              <div className="pbi-actions-top">
                <span>Archivo</span>
                <span>Exportar</span>
                <span>Compartir</span>
                <span>Ver pantalla completa</span>
              </div>
            </div>

            {/* Viewport */}
            <div className="pbi-report-viewport">
              
              {/* Canvas Principal */}
              <div className="pbi-canvas">
                
                {/* KPIs Row */}
                <div className="pbi-kpi-row">
                  <div className="pbi-kpi-card">
                    <span>Monto Ventas Cobradas</span>
                    <strong>${pbiMetrics.totalAmount.toLocaleString('es-CL')}</strong>
                  </div>
                  <div className="pbi-kpi-card">
                    <span>Volumen Transacciones</span>
                    <strong>{pbiMetrics.count} u.</strong>
                  </div>
                  <div className="pbi-kpi-card">
                    <span>Ticket Promedio</span>
                    <strong>${pbiMetrics.ticketPromedio.toLocaleString('es-CL')}</strong>
                  </div>
                  <div className="pbi-kpi-card">
                    <span>Eficiencia de Mapeo CRM</span>
                    <strong>{pbiMetrics.crmMatchRate}%</strong>
                  </div>
                </div>

                {/* Subpestañas del Reporte */}
                {pbiTab === 'overview' && (
                  <div className="pbi-charts-row">
                    {/* Ventas por Canal */}
                    <div className="pbi-chart-card">
                      <h4>Ventas por Canal (POS vs Web)</h4>
                      <div className="bar-chart-container">
                        <div className="bar-chart-row">
                          <div className="bar-chart-label">Tienda Online</div>
                          <div className="bar-chart-track">
                            <div 
                              className="bar-chart-fill" 
                              style={{ 
                                width: `${pbiMetrics.totalAmount > 0 
                                  ? (activeFilteredOrders.filter(o => o.customer_name !== 'POS Cliente').reduce((s,o)=>s+o.total_amount,0)/pbiMetrics.totalAmount)*100 
                                  : 40}%`,
                                backgroundColor: '#f2c811' 
                              }}
                            ></div>
                          </div>
                          <div className="bar-chart-value">
                            ${activeFilteredOrders.filter(o => o.customer_name !== 'POS Cliente').reduce((s,o)=>s+o.total_amount,0).toLocaleString('es-CL')}
                          </div>
                        </div>
                        <div className="bar-chart-row">
                          <div className="bar-chart-label">POS Físico</div>
                          <div className="bar-chart-track">
                            <div 
                              className="bar-chart-fill" 
                              style={{ 
                                width: `${pbiMetrics.totalAmount > 0 
                                  ? (activeFilteredOrders.filter(o => o.customer_name === 'POS Cliente').reduce((s,o)=>s+o.total_amount,0)/pbiMetrics.totalAmount)*100 
                                  : 60}%`,
                                backgroundColor: '#111111' 
                              }}
                            ></div>
                          </div>
                          <div className="bar-chart-value">
                            ${activeFilteredOrders.filter(o => o.customer_name === 'POS Cliente').reduce((s,o)=>s+o.total_amount,0).toLocaleString('es-CL')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Evolución Mensual */}
                    <div className="pbi-chart-card">
                      <h4>Evolución de Ventas Semanales</h4>
                      <div className="trend-chart-container">
                        <div className="trend-bars-wrapper">
                          {[
                            { label: 'Sem 1', val: 120000, h: '45%' },
                            { label: 'Sem 2', val: 195000, h: '70%' },
                            { label: 'Sem 3', val: 150000, h: '55%' },
                            { label: 'Sem 4', val: 260000, h: '95%' }
                          ].map((item, i) => (
                            <div key={i} className="trend-col">
                              <div className="trend-bar-fill" style={{ height: item.h, backgroundColor: '#10b981' }}>
                                <span className="trend-tooltip">${item.val.toLocaleString('es-CL')}</span>
                              </div>
                              <span className="trend-label">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {pbiTab === 'pareo' && (
                  <div className="pbi-charts-row">
                    
                    {/* Embudo de Conversión */}
                    <div className="pbi-chart-card">
                      <h4>Embudo de Conversión de Leads (CRM & POS)</h4>
                      <div className="funnel-container">
                        {[
                          { label: '1. Total Leads CRM', val: `${reconcileStats.totalCrm} Clientes`, pct: 100, class: 'funnel-fill-1' },
                          { label: '2. Contactados', val: `${Math.round(reconcileStats.totalCrm * 0.9)} Clientes`, pct: 90, class: 'funnel-fill-2' },
                          { label: '3. Cruzados con POS', val: `${reconcileStats.exactCount + reconcileStats.discrepancyCount} Coinciden`, pct: reconcileStats.totalCrm > 0 ? Math.round(((reconcileStats.exactCount + reconcileStats.discrepancyCount)/reconcileStats.totalCrm)*100) : 75, class: 'funnel-fill-3' },
                          { label: '4. Ventas Conciliadas', val: `${reconcileStats.exactCount} Cuadrados`, pct: reconcileStats.totalCrm > 0 ? Math.round((reconcileStats.exactCount/reconcileStats.totalCrm)*100) : 55, class: 'funnel-fill-4' }
                        ].map((stage, idx) => (
                          <div key={idx} className="funnel-stage">
                            <span className="funnel-stage-label">{stage.label}</span>
                            <div className="funnel-stage-bar">
                              <div className={`funnel-stage-fill ${stage.class}`} style={{ width: `${stage.pct}%` }}></div>
                              <span className="funnel-stage-text">{stage.val}</span>
                            </div>
                            <span className="funnel-stage-value">{stage.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mapa Geográfico de Ventas */}
                    <div className="pbi-chart-card">
                      <h4>Distribución Geográfica de Despacho (Región Metropolitana)</h4>
                      <div className="map-visual-container">
                        
                        {/* SVG Map */}
                        <div className="svg-map-wrapper">
                          <svg width="120" height="200" viewBox="0 0 120 200">
                            {/* Vitacura */}
                            <circle 
                              cx="85" cy="40" r="14" 
                              className={`map-commune-path ${activeCommune === 'Vitacura' ? 'active' : ''}`}
                              onMouseEnter={() => setActiveCommune('Vitacura')}
                              onMouseLeave={() => setActiveCommune(null)}
                            />
                            <text x="85" y="44" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold" pointerEvents="none">VIT</text>
                            
                            {/* Las Condes */}
                            <circle 
                              cx="90" cy="70" r="18" 
                              className={`map-commune-path ${activeCommune === 'Las Condes' ? 'active' : ''}`}
                              onMouseEnter={() => setActiveCommune('Las Condes')}
                              onMouseLeave={() => setActiveCommune(null)}
                            />
                            <text x="90" y="74" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold" pointerEvents="none">LCO</text>

                            {/* Providencia */}
                            <circle 
                              cx="60" cy="80" r="15" 
                              className={`map-commune-path ${activeCommune === 'Providencia' ? 'active' : ''}`}
                              onMouseEnter={() => setActiveCommune('Providencia')}
                              onMouseLeave={() => setActiveCommune(null)}
                            />
                            <text x="60" y="84" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold" pointerEvents="none">PRO</text>

                            {/* Ñuñoa */}
                            <circle 
                              cx="65" cy="115" r="16" 
                              className={`map-commune-path ${activeCommune === 'Ñuñoa' ? 'active' : ''}`}
                              onMouseEnter={() => setActiveCommune('Ñuñoa')}
                              onMouseLeave={() => setActiveCommune(null)}
                            />
                            <text x="65" y="119" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold" pointerEvents="none">ÑUÑ</text>

                            {/* Santiago Centro */}
                            <circle 
                              cx="30" cy="100" r="16" 
                              className={`map-commune-path ${activeCommune === 'Santiago' ? 'active' : ''}`}
                              onMouseEnter={() => setActiveCommune('Santiago')}
                              onMouseLeave={() => setActiveCommune(null)}
                            />
                            <text x="30" y="104" fontSize="8" textAnchor="middle" fill="#333" fontWeight="bold" pointerEvents="none">STG</text>
                          </svg>
                        </div>

                        {/* List communes info */}
                        <div className="communes-stats-list">
                          {[
                            { name: 'Las Condes', sales: '$14.990', leads: 4 },
                            { name: 'Providencia', sales: '$24.000', leads: 3 },
                            { name: 'Ñuñoa', sales: '$12.000', leads: 2 },
                            { name: 'Vitacura', sales: '$4.890', leads: 2 },
                            { name: 'Santiago', sales: '$9.500', leads: 3 }
                          ].map((c, i) => (
                            <div 
                              key={i} 
                              className="commune-stat-item"
                              style={{ 
                                backgroundColor: activeCommune === c.name ? 'rgba(16,185,129,0.06)' : '#fff',
                                borderColor: activeCommune === c.name ? '#10b981' : '#e1dfdd',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={() => setActiveCommune(c.name)}
                              onMouseLeave={() => setActiveCommune(null)}
                            >
                              <span>{c.name}</span>
                              <strong>{c.sales} ({c.leads} leads)</strong>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {pbiTab === 'details' && (
                  <div className="pbi-table-card">
                    <h4>Muestra de Órdenes Consultadas en Supabase</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="pbi-inner-table">
                        <thead>
                          <tr>
                            <th>Orden ID</th>
                            <th>Cliente</th>
                            <th>Medio de Pago</th>
                            <th>Fecha</th>
                            <th style={{ textAlign: 'right' }}>Monto Venta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeFilteredOrders.slice(0, 6).map(o => (
                            <tr key={o.id}>
                              <td><code>{o.id.substring(0, 8).toUpperCase()}</code></td>
                              <td>{o.customer_name}</td>
                              <td style={{ textTransform: 'capitalize' }}>{o.payment_method}</td>
                              <td>{new Date(o.created_at).toLocaleDateString('es-CL')}</td>
                              <td style={{ textAlign: 'right', fontWeight: '700' }}>${o.total_amount.toLocaleString('es-CL')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Filtros PBI */}
              <div className="pbi-filters-drawer">
                <h4>
                  <Filter size={13} />
                  <span>Filtros Reporte</span>
                </h4>
                
                <div className="pbi-filter-group">
                  <label>Canal de Venta</label>
                  <select 
                    className="pbi-filter-select"
                    value={pbiChannel}
                    onChange={(e) => setPbiChannel(e.target.value as any)}
                  >
                    <option value="all">Todos los Canales</option>
                    <option value="pos">POS (Tienda Física)</option>
                    <option value="web">Online (Pedidos Web)</option>
                  </select>
                </div>

                <div className="pbi-filter-group">
                  <label>Fecha Venta</label>
                  <select 
                    className="pbi-filter-select"
                    value={pbiDateRange}
                    onChange={(e) => setPbiDateRange(e.target.value as any)}
                  >
                    <option value="all">Todo el Historial</option>
                    <option value="last7">Últimos 7 días</option>
                    <option value="last30">Últimos 30 días</option>
                  </select>
                </div>

                <div className="pbi-filter-group">
                  <label>Medio de Pago</label>
                  <select 
                    className="pbi-filter-select"
                    value={pbiPayment}
                    onChange={(e) => setPbiPayment(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjetas (Débito/Crédito)</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Paginador PBI */}
            <div className="pbi-footer-pages">
              <button 
                onClick={() => setPbiTab('overview')} 
                className={`pbi-page-tab ${pbiTab === 'overview' ? 'active' : ''}`}
              >
                <TrendingUp size={11} />
                <span>Panel General Ventas</span>
              </button>
              
              <button 
                onClick={() => setPbiTab('pareo')} 
                className={`pbi-page-tab ${pbiTab === 'pareo' ? 'active' : ''}`}
              >
                <Users size={11} />
                <span>Análisis Pareo CRM</span>
              </button>

              <button 
                onClick={() => setPbiTab('details')} 
                className={`pbi-page-tab ${pbiTab === 'details' ? 'active' : ''}`}
              >
                <ShoppingBag size={11} />
                <span>Muestra de Datos</span>
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: CONEXIÓN POWER BI */}
        {activeTab === 'integration' && (
          <div className="integration-card">
            <h3>
              <Settings size={20} className="text-yellow" />
              Guía de Conexión de Supabase en Power BI Desktop
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
              Para conectar tu software de Power BI Desktop y visualizar la base de datos real de <strong>Chile Frutos Secos</strong> en tiempo real, puedes utilizar el adaptador de PostgreSQL nativo. Sigue los pasos indicados a continuación.
            </p>

            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div className="step-body">
                  <h4>Configurar Origen de Datos en Power BI</h4>
                  <p>Abre Power BI Desktop, selecciona <strong>Obtener Datos (Get Data)</strong> &gt; <strong>Base de datos PostgreSQL</strong>.</p>
                </div>
              </div>

              <div className="step-item">
                <div className="step-num">2</div>
                <div className="step-body">
                  <h4>Ingresar Parámetros de Conexión de Supabase</h4>
                  <p>Utiliza las credenciales de tu proyecto Supabase. Los datos de servidor recomendados son:</p>
                  
                  <div className="connection-details-box">
                    <span>Servidor (Host):</span>
                    <code>aws-0-us-east-1.pooler.supabase.com</code>
                    
                    <span>Base de datos (DB):</span>
                    <code>postgres</code>
                    
                    <span>Puerto:</span>
                    <code>5432</code>
                    
                    <span>Usuario:</span>
                    <code>postgres.cl_frutos_secos_pos</code>
                    
                    <span>Cadena de conexión URI:</span>
                    <code>postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres</code>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleCopyConnection('postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres')}
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <Copy size={12} style={{ marginRight: '6px' }} />
                      Copiar URI Conexión
                    </button>
                  </div>
                </div>
              </div>

              <div className="step-item">
                <div className="step-num">3</div>
                <div className="step-body">
                  <h4>Modelado Relacional de Tablas (Esquema de Estrella)</h4>
                  <p>
                    Una vez importadas las tablas, ve a la vista de modelo de Power BI y establece las siguientes relaciones para el cálculo de KPIs e informes:
                  </p>
                  <ul style={{ fontSize: '0.8rem', color: '#4b5563', paddingLeft: '20px', margin: '4px 0', lineHeight: 1.5 }}>
                    <li>Relacionar <code>products.id</code> (1) con <code>order_items.product_id</code> (*) con dirección de filtro único.</li>
                    <li>Relacionar <code>orders.id</code> (1) con <code>order_items.order_id</code> (*) habilitando eliminación en cascada.</li>
                    <li>Para reportes de CRM: importar la planilla reconciliada exportada desde la primera pestaña y relacionarla mediante el campo <code>Email</code> o <code>Teléfono</code> con <code>orders.customer_email</code>.</li>
                  </ul>
                </div>
              </div>

              <div className="step-item">
                <div className="step-num">4</div>
                <div className="step-body">
                  <h4>Importar Plantilla de Reporte</h4>
                  <p>
                    Puedes descargar la plantilla preconfigurada de Power BI <code>(.pbit)</code> que ya tiene el mapa de relaciones, los gráficos de barras y los colores corporativos de Chile Frutos Secos para que no tengas que diseñar desde cero.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => alert('Descargando archivo plantilla_reporte_cfs.pbit (Simulado)')}
                    className="btn-primary btn-sm btn-icon"
                    style={{ marginTop: '8px', alignSelf: 'flex-start', backgroundColor: '#f2c811', color: '#111' }}
                  >
                    <ExternalLink size={14} />
                    Descargar Plantilla .PBIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================
         CAJÓN LATERAL DE DETALLES Y RESOLUCIÓN DE DESCUADRES
         ========================================================= */}
      {selectedItem && (
        <div className="crm-detail-drawer-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="crm-detail-drawer" onClick={(e) => e.stopPropagation()}>
            
            <header className="drawer-header">
              <h3>Resolución de Descuadre</h3>
              <button className="close-drawer-btn" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </header>

            <div className="drawer-content">
              
              {/* Resumen de Estado */}
              <div className="drawer-subtitle-section">
                <div>
                  <span className="label">ESTADO DE COINCIDENCIA</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`match-status-badge ${selectedItem.status}`}>
                      {selectedItem.status === 'exact' && 'Cuadrado Exacto'}
                      {selectedItem.status === 'discrepancy' && 'Discrepancia en Monto'}
                      {selectedItem.status === 'missing_pos' && 'Falta en Ventas (POS)'}
                      {selectedItem.status === 'missing_crm' && 'Falta en CRM'}
                    </span>
                  </div>
                </div>
                {selectedItem.status === 'discrepancy' && (
                  <div style={{ textAlign: 'right' }}>
                    <span className="label">DESCUADRE</span>
                    <strong style={{ display: 'block', color: '#ef4444', fontSize: '1.1rem' }}>
                      ${(selectedItem.crmAmount - selectedItem.posAmount).toLocaleString('es-CL')}
                    </strong>
                  </div>
                )}
              </div>

              {/* Comparador Lado a Lado */}
              <div className="comparison-container">
                <div className="comparison-box crm-box">
                  <div className="comparison-box-title">Registro CRM Externo</div>
                  <div className="comparison-row">
                    <span className="field-lbl">Cliente:</span>
                    <span className="field-val">{selectedItem.crmAmount > 0 ? selectedItem.name : 'No registrado'}</span>
                  </div>
                  <div className="comparison-row">
                    <span className="field-lbl">Contacto:</span>
                    <span className="field-val">{selectedItem.crmAmount > 0 ? `${selectedItem.email} / ${selectedItem.phone}` : '-'}</span>
                  </div>
                  <div className="comparison-row">
                    <span className="field-lbl">Monto CRM:</span>
                    <span className="field-val" style={{ fontWeight: 'bold' }}>
                      {selectedItem.crmAmount > 0 ? `$${selectedItem.crmAmount.toLocaleString('es-CL')}` : '-'}
                    </span>
                  </div>
                </div>

                <div className="comparison-box pos-box">
                  <div className="comparison-box-title">Venta Registrada (POS / E-commerce)</div>
                  <div className="comparison-row">
                    <span className="field-lbl">Cliente:</span>
                    <span className="field-val">{selectedItem.posAmount > 0 ? selectedItem.name : 'No registrado'}</span>
                  </div>
                  <div className="comparison-row">
                    <span className="field-lbl">Contacto:</span>
                    <span className="field-val">{selectedItem.posAmount > 0 ? `${selectedItem.email} / ${selectedItem.phone}` : '-'}</span>
                  </div>
                  <div className="comparison-row">
                    <span className="field-lbl">Monto POS:</span>
                    <span className="field-val" style={{ fontWeight: 'bold' }}>
                      {selectedItem.posAmount > 0 ? `$${selectedItem.posAmount.toLocaleString('es-CL')}` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de Resolución */}
              <div className="resolutions-panel">
                <h4>Resolución de Incidencia</h4>
                
                {/* Caso 1: Discrepancia en monto */}
                {selectedItem.status === 'discrepancy' && (
                  <>
                    <button className="resolution-option-card" onClick={() => handleSyncToCrm(selectedItem)}>
                      <h5>
                        <Check size={14} className="text-green" />
                        Ajustar Ventas Locales
                      </h5>
                      <p>Igualar el monto en el POS/Ventas local al valor registrado en el CRM externo (${selectedItem.crmAmount.toLocaleString('es-CL')}).</p>
                    </button>
                    <button className="resolution-option-card" onClick={() => handleSyncToPos(selectedItem)}>
                      <h5>
                        <Check size={14} className="text-green" />
                        Ajustar Registro en CRM
                      </h5>
                      <p>Modificar el monto en la base del CRM externo para que coincida con lo cobrado físicamente en caja (${selectedItem.posAmount.toLocaleString('es-CL')}).</p>
                    </button>
                  </>
                )}

                {/* Caso 2: Falta en ventas */}
                {selectedItem.status === 'missing_pos' && (
                  <button className="resolution-option-card" onClick={() => handleCreateMissingOrder(selectedItem)}>
                    <h5>
                      <ShoppingBag size={14} className="text-primary" />
                      Generar Pedido POS Faltante
                    </h5>
                    <p>Crea una nueva orden de venta vinculada en el sistema para reflejar la compra del lead registrado en el CRM.</p>
                  </button>
                )}

                {/* Caso 3: Falta en CRM */}
                {selectedItem.status === 'missing_crm' && (
                  <button className="resolution-option-card" onClick={() => handleCreateCrmRecord(selectedItem)}>
                    <h5>
                      <Users size={14} className="text-primary" />
                      Registrar en CRM Externo
                    </h5>
                    <p>Exporta este registro y agrégalo en tu CRM externo como un contacto comercial con su volumen de compra actual.</p>
                  </button>
                )}

                {/* Común: Ignorar descuadre */}
                <button className="resolution-option-card action-danger" onClick={() => handleIgnoreItem(selectedItem)}>
                  <h5 style={{ color: '#ef4444' }}>
                    <X size={14} />
                    Ignorar Descuadre
                  </h5>
                  <p>Archivar descuadre y omitir de futuras alertas y reportes de conciliación.</p>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// --- DATA LOCAL DE PRUEBA ---
function getMockOrders(): Order[] {
  return [
    {
      id: 'ord_web_1',
      total_amount: 24000,
      payment_method: 'transfer',
      created_at: '2026-06-15T14:30:00Z',
      closure_id: null,
      customer_name: 'Juan Pérez',
      customer_email: 'juan.perez@example.com',
      customer_phone: '+56912345678',
      shipping_address: 'Av. Providencia 1234',
      shipping_city: 'Providencia',
      status: 'completed'
    },
    {
      id: 'ord_web_2',
      total_amount: 12000, // En el CRM está anotado como $15.000 (Simula discrepancia)
      payment_method: 'credit',
      created_at: '2026-06-16T18:15:00Z',
      closure_id: null,
      customer_name: 'María López',
      customer_email: 'maria.l@example.com',
      customer_phone: '+56987654321',
      shipping_address: 'Condell 456',
      shipping_city: 'Ñuñoa',
      status: 'completed'
    },
    {
      id: 'ord_pos_1',
      total_amount: 9500,
      payment_method: 'cash',
      created_at: '2026-06-14T11:00:00Z',
      closure_id: null,
      customer_name: 'Pedro Soto',
      customer_email: 'pedrosoto@gmail.com',
      customer_phone: '+56955551111',
      status: 'completed'
    },
    {
      id: 'ord_pos_2',
      total_amount: 12500,
      payment_method: 'debit',
      created_at: '2026-06-13T16:20:00Z',
      closure_id: null,
      customer_name: 'Diego Torres',
      customer_email: 'diego.t@hotmail.com',
      customer_phone: '+56944443333',
      status: 'completed'
    },
    {
      id: 'ord_web_3',
      total_amount: 4890,
      payment_method: 'transfer',
      created_at: '2026-06-18T10:00:00Z',
      closure_id: null,
      customer_name: 'Francisca Vial',
      customer_email: 'fran.vial@example.com',
      customer_phone: '+56933332222',
      shipping_address: 'Vitacura 990',
      shipping_city: 'Vitacura',
      status: 'completed'
    },
    {
      id: 'ord_web_4',
      total_amount: 14990, // En el CRM está por $11.990 (Simula discrepancia)
      payment_method: 'credit',
      created_at: '2026-06-12T15:30:00Z',
      closure_id: null,
      customer_name: 'Roberto Muñoz',
      customer_email: 'rober.m@example.com',
      customer_phone: '+56977776666',
      shipping_address: 'Apoquindo 4500',
      shipping_city: 'Las Condes',
      status: 'completed'
    },
    {
      id: 'ord_pos_3',
      total_amount: 9500,
      payment_method: 'cash',
      created_at: '2026-06-16T10:15:00Z',
      closure_id: null,
      customer_name: 'Carlos Muñoz',
      customer_email: 'carlos.m@example.com',
      customer_phone: '+56955554444',
      status: 'completed'
    }
  ];
}

// Copiar al portapapeles helper
const handleCopyConnection = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('¡Copia de conexión exitosa!');
};
