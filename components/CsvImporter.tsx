'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbService } from '@/services/supabase';
import './CsvImporter.css';

interface ParsedRow {
  sku: string;
  name: string;
  sell_type: 'unit' | 'weight';
  description: string;
  price: number;
  stock: number;
  image_url: string;
  isValid: boolean;
  errors: string[];
}

interface CsvImporterProps {
  onImportSuccess: () => void;
}

export const CsvImporter: React.FC<CsvImporterProps> = ({ onImportSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file, 'UTF-8');
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          parseCSV(csvText);
        } catch (err: any) {
          setMessage({ type: 'error', text: `Error al procesar archivo Excel: ${err.message || err}` });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setMessage({ type: 'error', text: 'Solo se permiten archivos en formato .csv o .xlsx' });
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      setMessage({ type: 'error', text: 'El archivo está vacío o no tiene datos de producto.' });
      return;
    }

    // Detectar separador (coma o punto y coma)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    // Función auxiliar para limpiar comillas
    const cleanValue = (val: string) => val.trim().replace(/^["']|["']$/g, '');

    // Mapear encabezados de manera inteligente
    const rawHeaders = firstLine.split(separator).map(cleanValue);

    const headers = rawHeaders.map(h => h.toLowerCase());
    const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('codigo') || h.includes('código'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nombre') || h.includes('titulo') || h.includes('título') || h.includes('producto'));
    const sellTypeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('medida') || h.includes('sell') || h.includes('formato') || h.includes('unidad'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detalle') || h.includes('descripcion') || h.includes('descripción'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('precio') || h.includes('valor'));
    const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('inventario') || h.includes('cant') || h.includes('cantidad'));

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Manejar valores con comillas que pueden contener separadores
      const line = lines[i];
      let values: string[] = [];
      let currentVal = '';
      let insideQuote = false;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === separator && !insideQuote) {
          values.push(cleanValue(currentVal));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(cleanValue(currentVal));

      // Si la línea está incompleta, saltar
      if (values.length < Math.min(rawHeaders.length, 2)) continue;

      const rawSku = skuIdx !== -1 && values[skuIdx] ? values[skuIdx] : `SKU-MOCK-${i}`;
      const rawName = nameIdx !== -1 && values[nameIdx] ? values[nameIdx] : `Producto Importado ${i}`;
      const rawDesc = descIdx !== -1 && values[descIdx] ? values[descIdx] : '';
      const rawPrice = priceIdx !== -1 && values[priceIdx] ? parseFloat(values[priceIdx].replace(/[^0-9.-]/g, '')) : 0;
      const rawStock = stockIdx !== -1 && values[stockIdx] ? parseFloat(values[stockIdx].replace(/[^0-9.-]/g, '')) : 0;

      const rawSellType = sellTypeIdx !== -1 && values[sellTypeIdx] && 
                          (values[sellTypeIdx].toLowerCase().includes('peso') || 
                           values[sellTypeIdx].toLowerCase().includes('weight') || 
                           values[sellTypeIdx].toLowerCase().includes('granel') || 
                           values[sellTypeIdx].toLowerCase().includes('kg')) 
                             ? 'weight' 
                             : 'unit';

      const errors: string[] = [];
      if (!values[skuIdx] && skuIdx !== -1) errors.push('SKU requerido.');
      if (!values[nameIdx] && nameIdx !== -1) errors.push('Nombre requerido.');
      if (isNaN(rawPrice) || rawPrice < 0) errors.push('Precio debe ser un número positivo.');
      if (isNaN(rawStock) || rawStock < 0) errors.push('Stock debe ser un número positivo.');

      rows.push({
        sku: rawSku,
        name: rawName,
        sell_type: rawSellType,
        description: rawDesc,
        price: isNaN(rawPrice) ? 0 : rawPrice,
        stock: isNaN(rawStock) ? 0 : rawStock,
        image_url: 'placeholder_imported',
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedRows(rows);
    setMessage(null);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'No hay productos válidos para importar.' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      // Cargar productos uno por uno (o actualizar si ya existen en stock)
      // Para pruebas locales o Supabase
      const existingProducts = await dbService.getProducts();

      for (const row of validRows) {
        const existing = existingProducts.find(p => p.sku === row.sku);
        if (existing) {
          // Si ya existe, actualizamos el stock sumándolo
          await dbService.updateProductStock(existing.id, existing.stock + row.stock);
        } else {
          // Si no existe, lo creamos
          await dbService.createProduct({
            sku: row.sku,
            name: row.name,
            sell_type: row.sell_type,
            description: row.description,
            price: row.price,
            stock: row.stock,
            image_url: row.image_url
          });
        }
      }

      setMessage({ type: 'success', text: `Se importaron ${validRows.length} productos exitosamente.` });
      setParsedRows([]);
      onImportSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Error al importar: ${err.message || err}` });
    } finally {
      setImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,SKU,Nombre,TipoVenta,Precio,Stock\nGRA-006,Almendras Tostadas,weight,15000,10.5\nENV-006,Frasco de Vidrio Grande,unit,2490,40";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="csv-importer-container">
      <div className="importer-header">
        <h3 className="panel-subtitle">Importador de Inventario Masivo</h3>
        <button type="button" onClick={handleDownloadTemplate} className="btn-secondary btn-sm">
          Descargar Plantilla CSV
        </button>
      </div>

      {parsedRows.length === 0 ? (
        <div 
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="file-input-hidden" 
            accept=".csv, .xlsx, .xls"
            onChange={handleChange}
          />
          <Upload className="dropzone-icon" />
          <p className="dropzone-text">Arrastra tu planilla <strong>.csv</strong> o <strong>.xlsx</strong> aquí o haz clic para buscar</p>
          <span className="dropzone-note">Columnas recomendadas: SKU, Nombre, Descripcion, Precio, Stock</span>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-toolbar">
            <span className="preview-summary">
              Se detectaron <strong>{parsedRows.length}</strong> filas. 
              ({parsedRows.filter(r => r.isValid).length} válidas, {parsedRows.filter(r => !r.isValid).length} con errores)
            </span>
            <div className="preview-actions">
              <button 
                type="button" 
                onClick={() => setParsedRows([])} 
                className="btn-secondary btn-sm"
                disabled={importing}
              >
                Limpiar
              </button>
              <button 
                type="button" 
                onClick={handleImport} 
                className="btn-primary btn-sm btn-icon"
                disabled={importing || parsedRows.filter(r => r.isValid).length === 0}
              >
                {importing ? <RefreshCw className="spinner" /> : <FileSpreadsheet size={16} />}
                {importing ? 'Importando...' : 'Confirmar e Importar'}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Detalles / Errores</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? 'row-valid' : 'row-invalid'}>
                    <td className="col-status">
                      {row.isValid ? (
                        <CheckCircle className="icon-valid" size={18} />
                      ) : (
                        <XCircle className="icon-invalid" size={18} />
                      )}
                    </td>
                    <td><code className="sku-code">{row.sku}</code></td>
                    <td className="col-name">{row.name}</td>
                    <td>{row.sell_type === 'weight' ? 'Granel (Kg)' : 'Envasado (Ud)'}</td>
                    <td>${row.price.toLocaleString('es-CL')}/{row.sell_type === 'weight' ? 'Kg' : 'Ud'}</td>
                    <td>{row.stock} {row.sell_type === 'weight' ? 'Kg' : 'uds.'}</td>
                    <td className="col-errors">
                      {row.isValid ? (
                        <span className="text-muted text-sm">Listo</span>
                      ) : (
                        <div className="error-badge-list">
                          {row.errors.map((err, eIdx) => (
                            <span key={eIdx} className="error-badge">
                              <AlertCircle size={10} /> {err}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
