'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Save, RefreshCw, CheckCircle2, Layout, Image as ImageIcon, 
  HelpCircle, Eye, Edit3, Globe, Database, Activity, Package, ArrowRight,
  Truck, ShieldCheck, Leaf, ExternalLink
} from 'lucide-react';
import { dbService } from '@/services/supabase';
import './WebContentManager.css';

interface HeroContent {
  title: string;
  subtitle: string;
  badge: string;
  button_primary_text: string;
  button_secondary_text: string;
  image_url: string;
}

interface TrustBadgeContent {
  title: string;
  subtitle: string;
}

export const WebContentManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMode, setActiveMode] = useState<'dashboard' | 'edit'>('dashboard');

  // Hero Section State
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [heroBtnPrimary, setHeroBtnPrimary] = useState('');
  const [heroBtnSecondary, setHeroBtnSecondary] = useState('');
  const [heroImage, setHeroImage] = useState('');

  // Trust Badges State
  const [shippingTitle, setShippingTitle] = useState('');
  const [shippingSubtitle, setShippingSubtitle] = useState('');
  
  const [originTitle, setOriginTitle] = useState('');
  const [originSubtitle, setOriginSubtitle] = useState('');

  const [secureTitle, setSecureTitle] = useState('');
  const [secureSubtitle, setSecureSubtitle] = useState('');

  // Loaded products count
  const [productCount, setProductCount] = useState(0);

  const loadContent = async () => {
    setLoading(true);
    try {
      const hero = await dbService.getWebPageContent('hero') as HeroContent;
      if (hero) {
        setHeroTitle(hero.title || '');
        setHeroSubtitle(hero.subtitle || '');
        setHeroBadge(hero.badge || '');
        setHeroBtnPrimary(hero.button_primary_text || '');
        setHeroBtnSecondary(hero.button_secondary_text || '');
        setHeroImage(hero.image_url || '');
      }

      const shipping = await dbService.getWebPageContent('shipping') as TrustBadgeContent;
      if (shipping) {
        setShippingTitle(shipping.title || '');
        setShippingSubtitle(shipping.subtitle || '');
      }

      const origin = await dbService.getWebPageContent('natural_origin') as TrustBadgeContent;
      if (origin) {
        setOriginTitle(origin.title || '');
        setOriginSubtitle(origin.subtitle || '');
      }

      const secure = await dbService.getWebPageContent('secure_shopping') as TrustBadgeContent;
      if (secure) {
        setSecureTitle(secure.title || '');
        setSecureSubtitle(secure.subtitle || '');
      }

      // Count products from Supabase
      const products = await dbService.getProducts();
      setProductCount(products.length || 8);
    } catch (err) {
      console.error('Error loading web page content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save Hero Section
      await dbService.saveWebPageContent('hero', {
        title: heroTitle,
        subtitle: heroSubtitle,
        badge: heroBadge,
        button_primary_text: heroBtnPrimary,
        button_secondary_text: heroBtnSecondary,
        image_url: heroImage
      });

      // Save Shipping trust card
      await dbService.saveWebPageContent('shipping', {
        title: shippingTitle,
        subtitle: shippingSubtitle
      });

      // Save Natural Origin trust card
      await dbService.saveWebPageContent('natural_origin', {
        title: originTitle,
        subtitle: originSubtitle
      });

      // Save Secure Shopping trust card
      await dbService.saveWebPageContent('secure_shopping', {
        title: secureTitle,
        subtitle: secureSubtitle
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setActiveMode('dashboard'); // Switch back to dashboard to see results
    } catch (err) {
      console.error('Error saving web page contents:', err);
      alert('Error al guardar el contenido.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="web-content-loading">
        <RefreshCw className="spinner" />
        <span>Cargando contenido de la página web...</span>
      </div>
    );
  }

  return (
    <div className="web-content-container animate-fade">
      {/* Cabecera Principal */}
      <header className="web-content-header">
        <div className="header-title-block">
          <h2>Administrador Web</h2>
          <span className="subtitle-block">Gestiona el contenido de tu portal de comercio electrónico de frutos secos</span>
        </div>

        {/* Selector de Pestañas Modernas */}
        <div className="web-editor-tabs-container">
          <button
            type="button"
            onClick={() => setActiveMode('dashboard')}
            className={`tab-toggle-btn ${activeMode === 'dashboard' ? 'active' : ''}`}
          >
            <Eye size={16} />
            <span>Modo Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('edit')}
            className={`tab-toggle-btn ${activeMode === 'edit' ? 'active' : ''}`}
          >
            <Edit3 size={16} />
            <span>Modo Editar página web</span>
          </button>
        </div>
      </header>

      {saveSuccess && (
        <div className="alert-success-banner">
          <CheckCircle2 size={18} />
          <span>¡Página web actualizada con éxito! Los cambios ya están reflejados en tiempo real.</span>
        </div>
      )}

      {/* --- MODO DASHBOARD --- */}
      {activeMode === 'dashboard' && (
        <div className="web-dashboard-view animate-fade">
          {/* Fila de Métricas Rápidas */}
          <div className="metrics-summary-grid">
            <div className="metric-overview-card">
              <div className="metric-icon-box bg-emerald-light">
                <Globe size={20} className="text-emerald" />
              </div>
              <div className="metric-info-box">
                <span className="metric-label">Estado de Tienda</span>
                <strong className="metric-value text-emerald">Activa & Online</strong>
              </div>
            </div>

            <div className="metric-overview-card">
              <div className="metric-icon-box bg-amber-light">
                <Database size={20} className="text-amber" />
              </div>
              <div className="metric-info-box">
                <span className="metric-label">Base de Datos</span>
                <strong className="metric-value">Supabase Cloud</strong>
              </div>
            </div>

            <div className="metric-overview-card">
              <div className="metric-icon-box bg-blue-light">
                <Package size={20} className="text-blue" />
              </div>
              <div className="metric-info-box">
                <span className="metric-label">Productos Activos</span>
                <strong className="metric-value">{productCount} Ítems</strong>
              </div>
            </div>

            <div className="metric-overview-card">
              <div className="metric-icon-box bg-purple-light">
                <Activity size={20} className="text-purple" />
              </div>
              <div className="metric-info-box">
                <span className="metric-label">Sincronización</span>
                <strong className="metric-value">Tiempo Real (RLS)</strong>
              </div>
            </div>
          </div>

          {/* Sección de la Previsualización de la Web */}
          <div className="live-preview-section">
            <div className="preview-card-header">
              <div className="header-meta">
                <Globe size={18} className="header-meta-icon" />
                <h3>Previsualización en Tiempo Real</h3>
              </div>
              <a 
                href="http://localhost:3001" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-link-store"
              >
                <span>Ver tienda en vivo</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Simulación del Navegador */}
            <div className="browser-mockup-wrapper">
              {/* Barra superior de navegador */}
              <div className="browser-top-bar">
                <div className="browser-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="browser-address-bar">
                  <span>http://localhost:3001</span>
                </div>
              </div>

              {/* Contenido Web Simulado */}
              <div className="mockup-web-body">
                {/* Announcement Bar */}
                <div className="mockup-announcement-bar">
                  <span>Envío gratis a toda la R.M. por compras sobre $50.000</span>
                </div>

                {/* Navbar */}
                <div className="mockup-navbar">
                  <div className="mockup-logo">
                    <span className="logo-letter">C</span>
                    <strong className="logo-text">Chile <span className="green-txt">Frutos Secos</span></strong>
                  </div>
                  <div className="mockup-nav-links">
                    <span className="active-nav">Inicio</span>
                    <span>Tienda</span>
                    <span>Ofertas</span>
                  </div>
                  <div className="mockup-cart-icon">
                    <span className="cart-badge">0</span>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="mockup-hero-banner">
                  <div className="mockup-hero-content">
                    <div className="mockup-badge">
                      <Sparkles size={10} className="badge-spark" />
                      <span>{heroBadge || "Calidad de Selección Premium"}</span>
                    </div>
                    <h2 className="mockup-hero-title">
                      {heroTitle || "Chile Frutos Secos – Venta online y mayorista"}
                    </h2>
                    <p className="mockup-hero-subtitle">
                      {heroSubtitle || "Venta online y mayorista de frutos secos deshidratados, semillas y harinas de calidad."}
                    </p>
                    <div className="mockup-hero-buttons">
                      <span className="mockup-btn primary">{heroBtnPrimary || "Ver Catálogo"}</span>
                      <span className="mockup-btn secondary">{heroBtnSecondary || "Ver Nueces"}</span>
                    </div>
                  </div>

                  <div className="mockup-hero-image-pane">
                    <div className="mockup-image-frame">
                      {heroImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={heroImage} alt="Preview Hero" className="mockup-hero-img" />
                      ) : (
                        <div className="mockup-img-placeholder">
                          <Leaf size={40} className="text-mint-dark" />
                          <span className="placeholder-lbl">Imagen Destacada</span>
                        </div>
                      )}
                      {/* Floating overlay badges inside mockup */}
                      <div className="mockup-overlay-badge bottom">
                        <Leaf size={12} className="text-emerald" />
                        <span>100% Orgánico</span>
                      </div>
                      <div className="mockup-overlay-badge top">
                        <ShieldCheck size={12} className="text-orange" />
                        <span>Control POS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges Bar */}
                <div className="mockup-trust-badges-bar">
                  <div className="mockup-trust-card">
                    <Truck size={16} className="trust-icon" />
                    <div className="trust-text">
                      <h5>{shippingTitle || "Despacho gratis sobre $50.000"}</h5>
                      <p>{shippingSubtitle || "Envios gratis en toda la RM por compras sobre $50.000"}</p>
                    </div>
                  </div>
                  <div className="mockup-trust-card">
                    <Leaf size={16} className="trust-icon" />
                    <div className="trust-text">
                      <h5>{originTitle || "Pago Contra Entrega"}</h5>
                      <p>{originSubtitle || "Paga al momento de recibir tu pedido en Santiago"}</p>
                    </div>
                  </div>
                  <div className="mockup-trust-card">
                    <ShieldCheck size={16} className="trust-icon" />
                    <div className="trust-text">
                      <h5>{secureTitle || "Envíos Rápidos"}</h5>
                      <p>{secureSubtitle || "Entre 24 a 48 hrs hábiles en RM"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sugerencia de redirección al editor */}
            <div className="dashboard-footer-action-box">
              <p>¿Quieres realizar cambios en este contenido?</p>
              <button 
                type="button" 
                onClick={() => setActiveMode('edit')} 
                className="btn-primary-dashboard"
              >
                <span>Abrir Editor de Contenido</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODO EDITAR PAGINA WEB --- */}
      {activeMode === 'edit' && (
        <form onSubmit={handleSaveAll} className="web-content-form animate-fade">
          <div className="content-grid-layout">
            {/* Seccion Hero (Banner Principal) */}
            <section className="editor-card hero-editor-card">
              <div className="card-header">
                <Layout size={20} className="header-icon" />
                <h3>Sección Principal (Hero Banner)</h3>
              </div>
              
              <div className="editor-fields-group">
                <div className="form-group">
                  <label htmlFor="hero-badge-input">Texto Distintivo (Badge de Destacado)</label>
                  <input 
                    id="hero-badge-input"
                    type="text" 
                    value={heroBadge} 
                    onChange={(e) => setHeroBadge(e.target.value)} 
                    placeholder="Ej: Calidad de Selección Premium"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hero-title-input">Título Principal (H1)</label>
                  <textarea 
                    id="hero-title-input"
                    value={heroTitle} 
                    onChange={(e) => setHeroTitle(e.target.value)} 
                    rows={2}
                    placeholder="Título llamativo sobre alimentación saludable..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hero-subtitle-input">Párrafo de Introducción / Bajada de Título</label>
                  <textarea 
                    id="hero-subtitle-input"
                    value={heroSubtitle} 
                    onChange={(e) => setHeroSubtitle(e.target.value)} 
                    rows={4}
                    placeholder="Descripción de frutos secos a granel y envío nacional..."
                  />
                </div>

                <div className="form-row-grid">
                  <div className="form-group">
                    <label htmlFor="hero-btn-primary-input">Texto Botón Primario</label>
                    <input 
                      id="hero-btn-primary-input"
                      type="text" 
                      value={heroBtnPrimary} 
                      onChange={(e) => setHeroBtnPrimary(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hero-btn-secondary-input">Texto Botón Secundario</label>
                    <input 
                      id="hero-btn-secondary-input"
                      type="text" 
                      value={heroBtnSecondary} 
                      onChange={(e) => setHeroBtnSecondary(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group image-upload-group">
                  <label htmlFor="hero-image-file">Imagen del Banner Derecho</label>
                  <div className="image-picker-box">
                    <input 
                      id="hero-image-file"
                      type="file" 
                      accept="image/*" 
                      onChange={handleHeroImageChange} 
                      className="file-input"
                    />
                    <div className="upload-placeholder-content">
                      <ImageIcon size={24} />
                      <span>Haga clic para subir una foto personalizada</span>
                    </div>
                  </div>

                  {heroImage && (
                    <div className="hero-preview-container">
                      <span className="preview-label">Vista Previa Actual de la Imagen:</span>
                      <div className="hero-preview-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroImage} alt="Banner Preview" className="hero-preview-img" />
                        <button 
                          type="button" 
                          onClick={() => setHeroImage('')} 
                          className="btn-delete-preview"
                        >
                          Remover Imagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Tarjetas de Beneficios (Trust Badges) */}
            <section className="editor-card trust-editor-card">
              <div className="card-header">
                <Sparkles size={20} className="header-icon" />
                <h3>Tarjetas de Confianza (Bajo el Banner)</h3>
              </div>

              <div className="editor-fields-group space-y-6">
                {/* Tarjeta 1: Despacho */}
                <div className="trust-card-editor-block">
                  <span className="block-number">Beneficio 1</span>
                  <div className="form-group">
                    <label htmlFor="shipping-title-input">Título del Beneficio</label>
                    <input 
                      id="shipping-title-input"
                      type="text" 
                      value={shippingTitle} 
                      onChange={(e) => setShippingTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping-sub-input">Descripción Corta</label>
                    <textarea 
                      id="shipping-sub-input"
                      value={shippingSubtitle} 
                      onChange={(e) => setShippingSubtitle(e.target.value)} 
                      rows={2}
                    />
                  </div>
                </div>

                {/* Tarjeta 2: Origen */}
                <div className="trust-card-editor-block">
                  <span className="block-number">Beneficio 2</span>
                  <div className="form-group">
                    <label htmlFor="origin-title-input">Título del Beneficio</label>
                    <input 
                      id="origin-title-input"
                      type="text" 
                      value={originTitle} 
                      onChange={(e) => setOriginTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="origin-sub-input">Descripción Corta</label>
                    <textarea 
                      id="origin-sub-input"
                      value={originSubtitle} 
                      onChange={(e) => setOriginSubtitle(e.target.value)} 
                      rows={2}
                    />
                  </div>
                </div>

                {/* Tarjeta 3: Seguridad */}
                <div className="trust-card-editor-block">
                  <span className="block-number">Beneficio 3</span>
                  <div className="form-group">
                    <label htmlFor="secure-title-input">Título del Beneficio</label>
                    <input 
                      id="secure-title-input"
                      type="text" 
                      value={secureTitle} 
                      onChange={(e) => setSecureTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="secure-sub-input">Descripción Corta</label>
                    <textarea 
                      id="secure-sub-input"
                      value={secureSubtitle} 
                      onChange={(e) => setSecureSubtitle(e.target.value)} 
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Botón de Guardar Fijo Abajo */}
          <div className="form-save-footer">
            <div className="footer-info">
              <HelpCircle size={16} />
              <span>Los cambios guardados se sincronizan en la base de datos Supabase de forma inmediata.</span>
            </div>
            <button 
              type="submit" 
              className="btn-primary btn-save-content" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  <span>Guardando Cambios...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Publicar Cambios de Contenido</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
