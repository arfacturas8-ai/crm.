/**
 * CSV/Excel Import/Export utilities for CRM
 */

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
