'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, Edit2, Trash2, Check, X } from 'lucide-react';
import { dbService, type Category } from '@/services/supabase';
import './CategoriesView.css';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  const loadCategories = async () => {
    try {
      const data = await dbService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    const unsubscribe = dbService.subscribeToCategories(() => loadCategories());
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await dbService.createCategory({
        name: name.trim(),
        slug: '', // DB trigger or helper will generate from name
        active
      });
      setName('');
      setActive(true);
      setShowAddForm(false);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert('Error al crear la categoría.');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditActive(cat.active);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await dbService.updateCategory(id, {
        name: editName.trim(),
        active: editActive
      });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios.');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await dbService.updateCategory(cat.id, {
        active: !cat.active
      });
      loadCategories();
    } catch (err) {
      console.error(err);
      alert('Error al cambiar el estado de la categoría.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"? Los productos asociados quedarán sin categoría.`)) {
      try {
        await dbService.deleteCategory(id);
        loadCategories();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar la categoría.');
      }
    }
  };

  return (
    <div className="categories-view-container animate-fade">
      <header className="categories-view-header">
        <div className="header-title-block">
          <h2>Categorías de Productos</h2>
          <span className="subtitle-block">Organización del catálogo para reportes, filtros del POS y catálogo web</span>
        </div>
        <button 
          type="button" 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary btn-sm btn-icon"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Cerrar' : 'Nueva Categoría'}</span>
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-category-form animate-down">
          <h3>Crear Nueva Categoría</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cat-name">Nombre de la Categoría *</label>
              <input 
                id="cat-name"
                type="text" 
                placeholder="Ej: Endulzantes Naturales"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', paddingTop: '24px' }}>
              <label htmlFor="cat-active" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input 
                  id="cat-active"
                  type="checkbox" 
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Activar categoría para la web</span>
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar Categoría</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <span>Cargando categorías...</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th className="text-center">Productos Asociados</th>
                <th className="text-center">Estado en Web</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="cat-name-cell">
                    <Tag size={14} className="text-emerald" />
                    {editingId === cat.id ? (
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: '4px', width: '200px' }}
                      />
                    ) : (
                      <strong>{cat.name}</strong>
                    )}
                  </td>
                  <td className="cat-desc-cell">
                    <code>{cat.slug}</code>
                  </td>
                  <td className="text-center font-bold">{cat.itemCount || 0} uds.</td>
                  <td className="text-center">
                    {editingId === cat.id ? (
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={editActive} 
                          onChange={(e) => setEditActive(e.target.checked)}
                        />
                        <span>Activa</span>
                      </label>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`status-badge ${cat.active ? 'active' : 'inactive'}`}
                        style={{ border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </button>
                    )}
                  </td>
                  <td className="text-center actions-cell">
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleSaveEdit(cat.id)}
                          className="btn-icon-only text-emerald"
                          title="Guardar"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingId(null)}
                          className="btn-icon-only text-red"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => startEdit(cat)}
                          className="btn-icon-only text-secondary"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="btn-icon-only text-red"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-data" style={{ textAlign: 'center', padding: '24px', color: '#718096' }}>
                    No hay categorías registradas. Crea una nueva arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
