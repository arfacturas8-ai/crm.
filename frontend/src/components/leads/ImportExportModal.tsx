'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CREATE_LEAD } from '@/graphql/queries/leads';
import {
  parseCSV,
  parseXLSX,
  csvToLeads,
  leadsToCSV,
  leadsToXLSX,
  generateLeadTemplate,
  generateLeadTemplateXLSX,
  downloadFile,
  downloadArrayBuffer,
  readFileAsText,
  readFileAsArrayBuffer,
  getFileType,
} from '@/lib/csv-utils';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';

interface ImportExportModalProps {
  leads: Lead[];
  onClose: () => void;
  onImportComplete: () => void;
}

type TabType = 'import' | 'export';
type ExportFormat = 'csv' | 'xlsx';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function ImportExportModal({
  leads,
  onClose,
  onImportComplete,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('import');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Partial<Lead>[] | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createLead] = useMutation(CREATE_LEAD);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const fileType = getFileType(selectedFile.name);
      let parsedData: Record<string, string>[];

      if (fileType === 'xlsx') {
        const buffer = await readFileAsArrayBuffer(selectedFile);
        parsedData = parseXLSX(buffer);
      } else {
        const content = await readFileAsText(selectedFile);
        parsedData = parseCSV(content);
      }

      const leads = csvToLeads(parsedData);
      setPreviewData(leads.slice(0, 5)); // Show first 5 rows
    } catch (error) {
      console.error('Error parsing file:', error);
      setPreviewData(null);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      const fileType = getFileType(file.name);
      let parsedData: Record<string, string>[];

      if (fileType === 'xlsx') {
        const buffer = await readFileAsArrayBuffer(file);
        parsedData = parseXLSX(buffer);
      } else {
        const content = await readFileAsText(file);
        parsedData = parseCSV(content);
      }

      const leadsToImport = csvToLeads(parsedData);

      for (const lead of leadsToImport) {
        if (!lead.name) {
          result.failed++;
          result.errors.push(`Fila sin nombre`);
          continue;
        }

        try {
          await createLead({
            variables: {
              input: {
                name: lead.name,
                email: lead.email || '',
                mobile: lead.mobile || '',
                source: lead.source || 'direct',
                message: lead.message || '',
                status: lead.status || 'new',
              },
            },
          });
          result.success++;
        } catch (err: any) {
          result.failed++;
          result.errors.push(`Error al importar "${lead.name}": ${err.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error al procesar archivo: ${error.message}`);
    }

    setImporting(false);
    setImportResult(result);

    if (result.success > 0) {
      onImportComplete();
    }
  };

  // Handle export
  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    if (exportFormat === 'xlsx') {
      const buffer = leadsToXLSX(leads);
      downloadArrayBuffer(buffer, `leads_habitacr_${date}.xlsx`);
    } else {
      const csv = leadsToCSV(leads);
      downloadFile(csv, `leads_habitacr_${date}.csv`);
    }
  };

  // Handle template download
  const handleDownloadTemplate = (format: ExportFormat) => {
    if (format === 'xlsx') {
      const buffer = generateLeadTemplateXLSX();
      downloadArrayBuffer(buffer, 'plantilla_leads_habitacr.xlsx');
    } else {
      const template = generateLeadTemplate();
      downloadFile(template, 'plantilla_leads_habitacr.csv');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-2xl mx-4 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Importar / Exportar Leads
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'import'
                ? 'text-[#8B4513] border-[#8B4513]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'export'
                ? 'text-[#8B4513] border-[#8B4513]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            <Download size={16} />
            Exportar
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              {/* Template download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="text-blue-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      Descargar plantilla
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Usa nuestra plantilla para asegurar que tus datos se
                      importen correctamente.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleDownloadTemplate('xlsx')}
                      >
                        <FileDown size={14} className="mr-2" />
                        Excel (.xlsx)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleDownloadTemplate('csv')}
                      >
                        <FileDown size={14} className="mr-2" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#8B4513] transition-colors"
                >
                  <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                  {file ? (
                    <p className="text-gray-900 font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        Arrastra un archivo o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Formatos soportados: CSV, XLSX (Excel)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Preview */}
              {previewData && previewData.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vista previa ({previewData.length} filas)
                  </label>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Telefono
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Fuente
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.map((lead, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900">
                              {lead.name || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {lead.email || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {lead.mobile || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {lead.source || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div
                  className={cn(
                    'rounded-lg p-4',
                    importResult.success > 0 && importResult.failed === 0
                      ? 'bg-green-50 border border-green-200'
                      : importResult.failed > 0
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-red-50 border border-red-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {importResult.success > 0 ? (
                      <CheckCircle className="text-green-600 mt-0.5\" size={20} />
                    ) : (
                      <AlertCircle className="text-red-600 mt-0.5\" size={20} />
                    )}
                    <div>
                      <p className="font-medium">
                        {importResult.success} leads importados exitosamente
                        {importResult.failed > 0 &&
                          `, ${importResult.failed} fallaron`}
                      </p>
                      {importResult.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                          {importResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>
                              ... y {importResult.errors.length - 5} errores mas
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Import button */}
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                isLoading={importing}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                Importar Leads
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="text-gray-600 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      Exportar {leads.length} leads
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Se exportaran todos los leads actuales. Selecciona el
                      formato que prefieras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de exportacion
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportFormat('xlsx')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors',
                      exportFormat === 'xlsx'
                        ? 'border-[#8B4513] bg-[#8B4513]/5 text-[#8B4513]'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <FileSpreadsheet size={20} />
                    <div className="text-left">
                      <p className="font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-gray-500">Recomendado</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors',
                      exportFormat === 'csv'
                        ? 'border-[#8B4513] bg-[#8B4513]/5 text-[#8B4513]'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <FileSpreadsheet size={20} />
                    <div className="text-left">
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-gray-500">Compatible universal</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Columns info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Columnas incluidas
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Nombre',
                    'Email',
                    'Telefono',
                    'Fuente',
                    'Mensaje',
                    'Estado',
                    'Fecha Creacion',
                  ].map((col) => (
                    <span
                      key={col}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Export button */}
              <Button onClick={handleExport} className="w-full">
                <Download size={16} className="mr-2" />
                Descargar {exportFormat === 'xlsx' ? 'Excel' : 'CSV'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
