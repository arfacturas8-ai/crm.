/**
 * CSV/Excel Import/Export utilities for CRM
 * Supports both CSV and XLSX formats
 */

import * as XLSX from 'xlsx';
import { Lead, LeadSource } from '@/types';

// Template columns for leads import
export const LEAD_IMPORT_COLUMNS = [
  'nombre',
  'email',
  'telefono',
  'fuente',
  'mensaje',
  'estado',
];

export const LEAD_SOURCE_MAP: Record<string, LeadSource> = {
  whatsapp: 'whatsapp',
  'sitio web': 'website',
  website: 'website',
  facebook: 'facebook',
  instagram: 'instagram',
  'market place': 'marketplace',
  marketplace: 'marketplace',
  google: 'google',
  directo: 'direct',
  direct: 'direct',
  rotulo: 'sign',
  sign: 'sign',
};

export const STATUS_MAP: Record<string, Lead['status']> = {
  nuevo: 'new',
  new: 'new',
  contactado: 'contacted',
  contacted: 'contacted',
  calificado: 'qualified',
  qualified: 'qualified',
  convertido: 'converted',
  converted: 'converted',
  perdido: 'lost',
  lost: 'lost',
};

/**
 * Parse CSV content into array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Get headers from first line
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Parse data rows
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx].trim();
      });
      data.push(row);
    }
  }

  return data;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Convert parsed CSV data to Lead format
 */
export function csvToLeads(
  csvData: Record<string, string>[]
): Partial<Lead>[] {
  return csvData.map((row) => {
    const sourceRaw = (row.fuente || row.source || 'direct').toLowerCase();
    const statusRaw = (row.estado || row.status || 'new').toLowerCase();

    return {
      name: row.nombre || row.name || '',
      email: row.email || row.correo || '',
      mobile: row.telefono || row.phone || row.mobile || '',
      source: LEAD_SOURCE_MAP[sourceRaw] || 'direct',
      message: row.mensaje || row.message || '',
      status: STATUS_MAP[statusRaw] || 'new',
    };
  });
}

/**
 * Generate CSV content from leads
 */
export function leadsToCSV(leads: Lead[]): string {
  const headers = [
    'Nombre',
    'Email',
    'Telefono',
    'Fuente',
    'Mensaje',
    'Estado',
    'Fecha Creacion',
  ];

  const rows = leads.map((lead) => [
    escapeCSV(lead.name),
    escapeCSV(lead.email),
    escapeCSV(lead.mobile),
    escapeCSV(getSourceLabel(lead.source)),
    escapeCSV(lead.message || ''),
    escapeCSV(getStatusLabel(lead.status)),
    escapeCSV(new Date(lead.createdAt).toLocaleDateString('es-CR')),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get human-readable source label
 */
function getSourceLabel(source: LeadSource): string {
  const labels: Record<LeadSource, string> = {
    whatsapp: 'WhatsApp',
    website: 'Sitio Web',
    facebook: 'Facebook',
    instagram: 'Instagram',
    marketplace: 'Market Place',
    google: 'Google',
    direct: 'Directo',
    sign: 'Rotulo',
  };
  return labels[source] || source;
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: Lead['status']): string {
  const labels: Record<Lead['status'], string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    qualified: 'Calificado',
    converted: 'Convertido',
    lost: 'Perdido',
  };
  return labels[status] || status;
}

/**
 * Generate CSV template for import
 */
export function generateLeadTemplate(): string {
  const headers = ['Nombre', 'Email', 'Telefono', 'Fuente', 'Mensaje', 'Estado'];
  const exampleRow = [
    'Juan Perez',
    'juan@email.com',
    '88887777',
    'WhatsApp',
    'Interesado en casa en Escazu',
    'Nuevo',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}

/**
 * Download content as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Read file as ArrayBuffer (for XLSX)
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse XLSX file content to array of objects
 */
export function parseXLSX(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with headers
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false,
  });

  // Normalize headers to lowercase
  return rawData.map((row) => {
    const normalizedRow: Record<string, string> = {};
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[key.toLowerCase().trim()] = String(value || '').trim();
    });
    return normalizedRow;
  });
}

/**
 * Generate XLSX content from leads
 */
export function leadsToXLSX(leads: Lead[]): ArrayBuffer {
  const headers = [
    'Nombre',
    'Email',
    'Telefono',
    'Fuente',
    'Mensaje',
    'Estado',
    'Fecha Creacion',
  ];

  const rows = leads.map((lead) => ({
    'Nombre': lead.name,
    'Email': lead.email,
    'Telefono': lead.mobile,
    'Fuente': getSourceLabel(lead.source),
    'Mensaje': lead.message || '',
    'Estado': getStatusLabel(lead.status),
    'Fecha Creacion': new Date(lead.createdAt).toLocaleDateString('es-CR'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Nombre
    { wch: 30 }, // Email
    { wch: 15 }, // Telefono
    { wch: 15 }, // Fuente
    { wch: 40 }, // Mensaje
    { wch: 12 }, // Estado
    { wch: 15 }, // Fecha
  ];

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

/**
 * Generate XLSX template for import
 */
export function generateLeadTemplateXLSX(): ArrayBuffer {
  const headers = ['Nombre', 'Email', 'Telefono', 'Fuente', 'Mensaje', 'Estado'];
  const exampleRow = {
    'Nombre': 'Juan Perez',
    'Email': 'juan@email.com',
    'Telefono': '88887777',
    'Fuente': 'WhatsApp',
    'Mensaje': 'Interesado en casa en Escazu',
    'Estado': 'Nuevo',
  };

  const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 40 },
    { wch: 12 },
  ];

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

/**
 * Download ArrayBuffer as file
 */
export function downloadArrayBuffer(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
): void {
  const blob = new Blob([buffer], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Detect file type from extension
 */
export function getFileType(filename: string): 'csv' | 'xlsx' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'txt') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  return 'unknown';
}

// Re-export internal functions for XLSX
export { getSourceLabel, getStatusLabel };
