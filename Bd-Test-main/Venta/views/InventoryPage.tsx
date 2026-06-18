'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Database, RefreshCw, FileText, Trash2, Edit2, X, Star } from 'lucide-react';
import { dbService, type Product, type Category } from '@/services/supabase';
import { CsvImporter } from '@/components/CsvImporter';
import './InventoryPage.css';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'import'>('list');

  // Unified state for editing product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Formulario de Producto Nuevo
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sellType, setSellType] = useState<'unit' | 'weight'>('unit');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [weight, setWeight] = useState('0');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Extended details
  const [origin, setOrigin] = useState('');
  const [packagingInfo, setPackagingInfo] = useState('');
  const [allergensText, setAllergensText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [calories, setCalories] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  // Formulario de Edición
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSellType, setEditSellType] = useState<'unit' | 'weight'>('unit');
  const [editPrice, setEditPrice] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editWeight, setEditWeight] = useState('0');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  
  // Extended details edit
  const [editOrigin, setEditOrigin] = useState('');
  const [editPackagingInfo, setEditPackagingInfo] = useState('');
  const [editAllergensText, setEditAllergensText] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editCarbohydrates, setEditCarbohydrates] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editFiber, setEditFiber] = useState('');

  const loadData = async () => {
    try {
      const [prodsData, catsData] = await Promise.all([
        dbService.getProducts(),
        dbService.getCategories()
      ]);
      setProducts(prodsData);
      setDbCategories(catsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribeProds = dbService.subscribeToProducts(() => loadData());
    const unsubscribeCats = dbService.subscribeToCategories(() => loadData());
    return () => {
      unsubscribeProds();
      unsubscribeCats();
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditImageUrl(reader.result as string);
        } else {
          setImageUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${productName}"?`)) {
      try {
        await dbService.deleteProduct(productId);
        loadData();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar el producto.');
      }
    }
  };

  const handleAdjustStock = async (productId: string, amount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + amount);
    
    // Optimistic Update
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    
    try {
      await dbService.updateProductStock(productId, newStock);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || !price || !stock || !categoryId) {
      alert('Por favor completa los campos requeridos.');
      return;
    }

    const numPrice = parseFloat(price);
    const numStock = parseFloat(stock);
    const numSalePrice = salePrice ? parseFloat(salePrice) : null;
    const numWeight = parseFloat(weight) || 0;

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
      alert('Valores de precio o stock incorrectos.');
      return;
    }

    try {
      await dbService.createProduct({
        sku,
        name,
        slug: slug.trim() || undefined,
        sell_type: sellType,
        price: numPrice,
        sale_price: numSalePrice,
        stock: numStock,
        weight: numWeight,
        category_id: categoryId,
        is_featured: isFeatured,
        is_active: isActive,
        description,
        image_url: imageUrl || 'placeholder_custom',
        origin,
        packaging_info: packagingInfo,
        allergens: allergensText ? allergensText.split(',').map(a => a.trim()).filter(Boolean) : [],
        tags: tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [],
        nutrition: {
          calories: parseInt(calories) || 0,
          carbohydrates: parseInt(carbohydrates) || 0,
          protein: parseInt(protein) || 0,
          fat: parseInt(fat) || 0,
          fiber: parseInt(fiber) || 0,
        }
      });

      // Reset Form
      setSku('');
      setName('');
      setSlug('');
      setPrice('');
      setSalePrice('');
      setStock('');
      setWeight('0');
      setDescription('');
      setImageUrl('');
      setCategoryId('');
      setIsFeatured(false);
      setIsActive(true);
      setOrigin('');
      setPackagingInfo('');
      setAllergensText('');
      setTagsText('');
      setCalories('');
      setCarbohydrates('');
      setProtein('');
      setFat('');
      setFiber('');
      
      setShowAddForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error al crear el producto. Asegúrate de que el SKU o Slug sean únicos.');
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditSku(p.sku);
    setEditName(p.name);
    setEditSlug(p.slug || '');
    setEditSellType(p.sell_type);
    setEditPrice(p.price.toString());
    setEditSalePrice(p.sale_price ? p.sale_price.toString() : '');
    setEditStock(p.stock.toString());
    setEditWeight(p.weight ? p.weight.toString() : '0');
    setEditDescription(p.description || '');
    setEditImageUrl(p.image_url || '');
    setEditCategoryId(p.category_id || '');
    setEditIsFeatured(p.is_featured || false);
    setEditIsActive(p.is_active ?? true);
    
    setEditOrigin(p.origin || '');
    setEditPackagingInfo(p.packaging_info || '');
    setEditAllergensText(p.allergens ? p.allergens.join(', ') : '');
    setEditTagsText(p.tags ? p.tags.join(', ') : '');
    setEditCalories(p.nutrition?.calories?.toString() || '');
    setEditCarbohydrates(p.nutrition?.carbohydrates?.toString() || '');
    setEditProtein(p.nutrition?.protein?.toString() || '');
    setEditFat(p.nutrition?.fat?.toString() || '');
    setEditFiber(p.nutrition?.fiber?.toString() || '');
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editSku.trim() || !editName.trim() || !editPrice || !editStock || !editCategoryId) {
      alert('Por favor completa los campos requeridos.');
      return;
    }

    const numPrice = parseFloat(editPrice);
    const numStock = parseFloat(editStock);
    const numSalePrice = editSalePrice ? parseFloat(editSalePrice) : null;
    const numWeight = parseFloat(editWeight) || 0;

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
      alert('Valores de precio o stock incorrectos.');
      return;
    }

    try {
      await dbService.updateProduct(editingProduct.id, {
        sku: editSku,
        name: editName,
        slug: editSlug.trim() || undefined,
        sell_type: editSellType,
        price: numPrice,
        sale_price: numSalePrice,
        stock: numStock,
        weight: numWeight,
        category_id: editCategoryId,
        is_featured: editIsFeatured,
        is_active: editIsActive,
        description: editDescription,
        image_url: editImageUrl,
        origin: editOrigin,
        packaging_info: editPackagingInfo,
        allergens: editAllergensText ? editAllergensText.split(',').map(a => a.trim()).filter(Boolean) : [],
        tags: editTagsText ? editTagsText.split(',').map(t => t.trim()).filter(Boolean) : [],
        nutrition: {
          calories: parseInt(editCalories) || 0,
          carbohydrates: parseInt(editCarbohydrates) || 0,
          protein: parseInt(editProtein) || 0,
          fat: parseInt(editFat) || 0,
          fiber: parseInt(editFiber) || 0,
        }
      });

      setEditingProduct(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error al guardar cambios del producto.');
    }
  };

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <div className="inventory-title-row">
          <Package className="text-primary" size={24} />
          <h2>Control de Inventario</h2>
        </div>

        <div className="inventory-nav-tabs">
          <button 
            type="button" 
            onClick={() => setActiveSubTab('list')}
            className={`sub-tab-btn ${activeSubTab === 'list' ? 'active' : ''}`}
          >
            <FileText size={16} />
            <span>Lista de Productos</span>
          </button>
          <button 
            type="button" 
            onClick={() => setActiveSubTab('import')}
            className={`sub-tab-btn ${activeSubTab === 'import' ? 'active' : ''}`}
          >
            <Database size={16} />
            <span>Importador CSV</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="inventory-loading">
          <RefreshCw className="spinner" />
          <span>Sincronizando inventario en tiempo real con Supabase...</span>
        </div>
      ) : (
        <>
          {activeSubTab === 'list' && (
            <div className="inventory-list-tab animate-fade">
              <div className="toolbar-row">
                <h3>Catálogo General</h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-primary btn-sm btn-icon"
                >
                  <Plus size={14} />
                  <span>{showAddForm ? 'Cerrar Formulario' : 'Nuevo Producto'}</span>
                </button>
              </div>

              {/* Formulario para agregar producto */}
              {showAddForm && (
                <form onSubmit={handleAddProductSubmit} className="add-product-form animate-down" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
                  <h4 className="form-subtitle" style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', margin: 0 }}>Crear Nuevo Producto</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="prod-sku">SKU (Código Único) *</label>
                      <input id="prod-sku" type="text" placeholder="Ej: GRA-010" value={sku} onChange={(e) => setSku(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-name">Nombre del Producto *</label>
                      <input id="prod-name" type="text" placeholder="Ej: Almendras Premium" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-slug">Slug Web (URL)</label>
                      <input id="prod-slug" type="text" placeholder="Ej: almendras-premium (Opcional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-sell-type">Tipo de Venta *</label>
                      <select id="prod-sell-type" value={sellType} onChange={(e) => setSellType(e.target.value as 'unit' | 'weight')}>
                        <option value="unit">Por Unidad (Envasado)</option>
                        <option value="weight">A Granel / Por Peso (Kg)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-price">Precio Normal ($) *</label>
                      <input id="prod-price" type="number" placeholder="Ej: 9500" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-sale-price">Precio Oferta ($)</label>
                      <input id="prod-sale-price" type="number" placeholder="Ej: 8500 (Opcional)" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-stock">Stock Inicial *</label>
                      <input id="prod-stock" type="number" step="0.001" placeholder="Ej: 20" value={stock} onChange={(e) => setStock(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-weight">Peso (Kg) o Contenido</label>
                      <input id="prod-weight" type="number" step="0.001" placeholder="Ej: 0.250" value={weight} onChange={(e) => setWeight(e.target.value)} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="prod-cat">Categoría Web *</label>
                      <select id="prod-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                        <option value="">Selecciona una categoría...</option>
                        {dbCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <span>Destacar Producto en Home E-commerce</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <span>Activo / Visible en Catálogo Web</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="prod-desc">Descripción (POS & Web)</label>
                      <textarea id="prod-desc" placeholder="Detalles del producto..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prod-origin">Origen (Web)</label>
                      <input id="prod-origin" type="text" placeholder="Ej: Valle del Maipo, Chile" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ border: '1px solid #edf2f7', borderRadius: '8px', padding: '14px', backgroundColor: '#fff' }}>
                    <strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#4a5568' }}>Información Nutricional (por 100g)</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11px' }}>Calorías (kcal)</label>
                        <input type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px' }}>Carbohidratos (g)</label>
                        <input type="number" placeholder="g" value={carbohydrates} onChange={(e) => setCarbohydrates(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px' }}>Proteínas (g)</label>
                        <input type="number" placeholder="g" value={protein} onChange={(e) => setProtein(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px' }}>Grasas (g)</label>
                        <input type="number" placeholder="g" value={fat} onChange={(e) => setFat(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px' }}>Fibra (g)</label>
                        <input type="number" placeholder="g" value={fiber} onChange={(e) => setFiber(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="prod-allergens">Alérgenos (separados por coma)</label>
                      <input id="prod-allergens" type="text" placeholder="Ej: maní, gluten" value={allergensText} onChange={(e) => setAllergensText(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="prod-tags">Etiquetas Web (separadas por coma)</label>
                      <input id="prod-tags" type="text" placeholder="Ej: Keto, Orgánico, Sin Sal" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-image">Imagen del Producto (Subir foto)</label>
                    <input id="prod-image" type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} />
                    {imageUrl && (
                      <div className="image-preview" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <button type="button" onClick={() => setImageUrl('')} style={{ padding: '6px 12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>Eliminar foto</button>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px' }}>Guardar Producto</button>
                </form>
              )}

              {/* Tabla de Inventario */}
              <div className="table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th className="text-center">Imagen</th>
                      <th>SKU</th>
                      <th>Nombre / Info</th>
                      <th>Tipo</th>
                      <th>Precio (Normal/Oferta)</th>
                      <th className="text-center">Stock Actual</th>
                      <th>Ajuste Rápido</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ opacity: p.is_active === false ? 0.6 : 1 }}>
                        <td>
                          <div className="inventory-thumb-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {p.image_url && (p.image_url.startsWith('data:image/') || p.image_url.startsWith('http') || p.image_url.startsWith('/')) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt={p.name} className="inventory-thumb" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <div className="inventory-thumb-placeholder" style={{ width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', color: '#4a5568', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {p.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <code className="sku-code">{p.sku}</code>
                          <span style={{ fontSize: '9px', display: 'block', color: '#718096', marginTop: '2px' }}>{p.slug}</span>
                        </td>
                        <td className="name-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong>{p.name}</strong>
                            {p.is_featured && <span title="Destacado en Home"><Star size={12} fill="#d97706" color="#d97706" /></span>}
                            {p.is_active === false && <span style={{ fontSize: '8px', backgroundColor: '#fee2e2', color: '#ef4444', padding: '1px 4px', borderRadius: '3px' }}>Inactivo en Web</span>}
                          </div>
                          <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>{p.description || 'Sin descripción'}</span>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {p.category && <span style={{ fontSize: '9px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>Categoría: {p.category}</span>}
                            {p.weight ? <span style={{ fontSize: '9px', backgroundColor: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>{p.weight} kg</span> : null}
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${p.sell_type}`}>
                            {p.sell_type === 'weight' ? 'Granel (Kg)' : 'Envasado (Ud)'}
                          </span>
                        </td>
                        <td className="price-cell">
                          {p.sale_price ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ textDecoration: 'line-through', color: '#a0aec0', fontSize: '12px' }}>${p.price.toLocaleString('es-CL')}</span>
                              <strong style={{ color: '#e53e3e' }}>${p.sale_price.toLocaleString('es-CL')}</strong>
                            </div>
                          ) : (
                            <span>${p.price.toLocaleString('es-CL')}</span>
                          )}
                          <span className="unit-label">/{p.sell_type === 'weight' ? 'Kg' : 'Ud'}</span>
                        </td>
                        <td className="text-center">
                          <span className={`stock-badge ${p.stock <= 0 ? 'out' : p.stock <= 5 ? 'low' : 'ok'}`}>
                            {p.stock} {p.sell_type === 'weight' ? 'Kg' : 'uds'}
                          </span>
                          {p.stock <= 5 && p.stock > 0 && <span style={{ display: 'block', fontSize: '9px', color: '#e53e3e', fontWeight: 'bold', marginTop: '2px' }}>Stock crítico</span>}
                          {p.stock <= 0 && <span style={{ display: 'block', fontSize: '9px', color: '#e53e3e', fontWeight: 'bold', marginTop: '2px' }}>Agotado</span>}
                        </td>
                        <td>
                          <div className="stock-adjuster">
                            <button 
                              type="button" 
                              onClick={() => handleAdjustStock(p.id, p.sell_type === 'weight' ? -0.5 : -1)}
                              className="adj-btn minus"
                              disabled={p.stock <= 0}
                            >
                              <Minus size={12} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleAdjustStock(p.id, p.sell_type === 'weight' ? 0.5 : 1)}
                              className="adj-btn plus"
                            >
                              <Plus size={12} />
                            </button>
                            {p.sell_type === 'weight' ? (
                              <button 
                                type="button" 
                                onClick={() => handleAdjustStock(p.id, 5.0)}
                                className="adj-btn plus-ten"
                              >
                                +5Kg
                              </button>
                            ) : (
                              <button 
                                type="button" 
                                onClick={() => handleAdjustStock(p.id, 10)}
                                className="adj-btn plus-ten"
                              >
                                +10
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-center" style={{ verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => startEditProduct(p)}
                              style={{ padding: '6px', color: '#3182ce', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ebf8ff'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Editar producto"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              style={{ padding: '6px', color: '#e53e3e', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Eliminar producto"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={8} className="no-data">
                          No hay productos registrados. Importa un CSV o crea uno nuevo arriba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'import' && (
            <div className="inventory-import-tab animate-fade">
              <CsvImporter onImportSuccess={loadData} />
            </div>
          )}
        </>
      )}

      {/* MODAL DE EDICIÓN FLOTANTE */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Editar Producto: {editingProduct.name}</h3>
              <button type="button" onClick={() => setEditingProduct(null)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
            </header>

            <form onSubmit={handleEditProductSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label>SKU (Código Único) *</label>
                  <input type="text" value={editSku} onChange={(e) => setEditSku(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Slug Web (URL)</label>
                  <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tipo de Venta *</label>
                  <select value={editSellType} onChange={(e) => setEditSellType(e.target.value as 'unit' | 'weight')}>
                    <option value="unit">Por Unidad (Envasado)</option>
                    <option value="weight">A Granel / Por Peso (Kg)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio Normal ($) *</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Precio Oferta ($)</label>
                  <input type="number" value={editSalePrice} onChange={(e) => setEditSalePrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Stock Actual *</label>
                  <input type="number" step="0.001" value={editStock} onChange={(e) => setEditStock(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Peso (Kg) o Contenido</label>
                  <input type="number" step="0.001" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Categoría Web *</label>
                  <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} required>
                    <option value="">Selecciona una categoría...</option>
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editIsFeatured} onChange={(e) => setEditIsFeatured(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Destacar Producto en Home E-commerce</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Activo / Visible en Catálogo Web</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
                <div className="form-group">
                  <label>Origen (Web)</label>
                  <input type="text" value={editOrigin} onChange={(e) => setEditOrigin(e.target.value)} />
                </div>
              </div>

              <div style={{ border: '1px solid #edf2f7', borderRadius: '8px', padding: '14px', backgroundColor: '#f7fafc' }}>
                <strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#4a5568' }}>Información Nutricional (por 100g)</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>Calorías (kcal)</label>
                    <input type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>Carbohidratos (g)</label>
                    <input type="number" value={editCarbohydrates} onChange={(e) => setEditCarbohydrates(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>Proteínas (g)</label>
                    <input type="number" value={editProtein} onChange={(e) => setEditProtein(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>Grasas (g)</label>
                    <input type="number" value={editFat} onChange={(e) => setEditFat(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>Fibra (g)</label>
                    <input type="number" value={editFiber} onChange={(e) => setEditFiber(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Alérgenos (separados por coma)</label>
                  <input type="text" value={editAllergensText} onChange={(e) => setEditAllergensText(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Etiquetas (separadas por coma)</label>
                  <input type="text" value={editTagsText} onChange={(e) => setEditTagsText(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Foto del Producto</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} />
                {editImageUrl && (
                  <div className="edit-image-preview" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImageUrl} alt="edit preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button type="button" onClick={() => setEditImageUrl('')} style={{ padding: '6px 12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>Eliminar foto</button>
                  </div>
                )}
              </div>

              <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#4a5568', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Guardar Cambios</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
