'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Save, RefreshCw, CheckCircle2, Layout, Image, HelpCircle } from 'lucide-react';
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
    } catch (err: any) {
      console.error('Error saving web page contents:', err);
      alert(`Error al guardar el contenido: ${err?.message || JSON.stringify(err)}`);
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
      <header className="web-content-header">
        <div className="header-title-block">
          <h2>Editor de Contenido Web</h2>
          <span className="subtitle-block">Modifica el texto, imágenes, banners y configuración visual de la página de Frutos Secos</span>
        </div>
      </header>

      {saveSuccess && (
        <div className="alert-success-banner">
          <CheckCircle2 size={18} />
          <span>¡Página web actualizada con éxito! Los cambios ya están reflejados en tiempo real.</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="web-content-form">
        <div className="content-grid-layout">
          {/* Seccion Hero (Banner Principal) */}
          <section className="editor-card hero-editor-card">
            <div className="card-header">
              <Layout size={20} className="header-icon" />
              <h3>Sección Principal (Hero)</h3>
            </div>
            
            <div className="editor-fields-group">
              <div className="form-group">
                <label htmlFor="hero-badge-input">Texto Distintivo (Badge)</label>
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
                  placeholder="Título que atrae al cliente..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="hero-subtitle-input">Párrafo de Introducción</label>
                <textarea 
                  id="hero-subtitle-input"
                  value={heroSubtitle} 
                  onChange={(e) => setHeroSubtitle(e.target.value)} 
                  rows={4}
                  placeholder="Descripción detallada de la tienda..."
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
                <label htmlFor="hero-image-file">Imagen Descriptiva (Banner Derecha)</label>
                <div className="image-picker-box">
                  <input 
                    id="hero-image-file"
                    type="file" 
                    accept="image/*" 
                    onChange={handleHeroImageChange} 
                    className="file-input"
                  />
                  <div className="upload-placeholder-content">
                    <Image size={24} />
                    <span>Haga clic para subir una foto personalizada</span>
                  </div>
                </div>

                {heroImage && (
                  <div className="hero-preview-container">
                    <span className="preview-label">Vista Previa Actual:</span>
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
              <h3>Tarjetas de Confianza (Píe del Hero)</h3>
            </div>

            <div className="editor-fields-group space-y-6">
              {/* Tarjeta 1: Despacho */}
              <div className="trust-card-editor-block">
                <span className="block-number">Beneficio 1</span>
                <div className="form-group">
                  <label htmlFor="shipping-title-input">Título</label>
                  <input 
                    id="shipping-title-input"
                    type="text" 
                    value={shippingTitle} 
                    onChange={(e) => setShippingTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="shipping-sub-input">Descripción</label>
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
                  <label htmlFor="origin-title-input">Título</label>
                  <input 
                    id="origin-title-input"
                    type="text" 
                    value={originTitle} 
                    onChange={(e) => setOriginTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="origin-sub-input">Descripción</label>
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
                  <label htmlFor="secure-title-input">Título</label>
                  <input 
                    id="secure-title-input"
                    type="text" 
                    value={secureTitle} 
                    onChange={(e) => setSecureTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="secure-sub-input">Descripción</label>
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

        {/* Boton de Guardar Flotante / Fijo abajo */}
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
    </div>
  );
};
