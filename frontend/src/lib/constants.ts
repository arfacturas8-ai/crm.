// Lead Status labels and utilities
export const LEAD_STATUS = {
  new: { label: 'Nuevo', color: 'blue' },
  contacted: { label: 'Contactado', color: 'yellow' },
  qualified: { label: 'Calificado', color: 'purple' },
  converted: { label: 'Convertido', color: 'green' },
  lost: { label: 'Perdido', color: 'red' },
} as const;

export type LeadStatus = keyof typeof LEAD_STATUS;

export function getLeadStatusLabel(status: string): string {
  return LEAD_STATUS[status as LeadStatus]?.label || status;
}

// Lead Source labels
export const LEAD_SOURCES = {
  whatsapp: { label: 'WhatsApp', icon: 'message-circle' },
  website: { label: 'Sitio web', icon: 'globe' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  marketplace: { label: 'Market Place', icon: 'shopping-bag' },
  google: { label: 'Google', icon: 'search' },
  direct: { label: 'Directo', icon: 'user' },
  sign: { label: 'Rótulo', icon: 'signpost' },
} as const;

export type LeadSource = keyof typeof LEAD_SOURCES;

export function getLeadSourceLabel(source: string): string {
  return LEAD_SOURCES[source as LeadSource]?.label || source;
}

// Deal/Pipeline Stages
export const DEAL_STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { id: 'contactado', label: 'Contactado', color: 'bg-[#8B4513]' },
  { id: 'visita-programada', label: 'Visita Programada', color: 'bg-[#a0522d]' },
  { id: 'seguimiento', label: 'Seguimiento', color: 'bg-[#cd853f]' },
  { id: 'potencial', label: 'Potencial', color: 'bg-amber-500' },
  { id: 'reserva', label: 'Reserva', color: 'bg-purple-500' },
  { id: 'formalizado', label: 'Formalizado', color: 'bg-indigo-500' },
  { id: 'descartado', label: 'Descartado', color: 'bg-gray-400' },
] as const;

export type DealStageId = typeof DEAL_STAGES[number]['id'];

export function getDealStageLabel(stageId: string): string {
  const stage = DEAL_STAGES.find(s => s.id === stageId);
  return stage?.label || stageId;
}

export function getDealStageColor(stageId: string): string {
  const stage = DEAL_STAGES.find(s => s.id === stageId);
  return stage?.color || 'bg-gray-400';
}

// Enquiry Status
export const ENQUIRY_STATUS = {
  active: { label: 'Activa', color: 'green' },
  matched: { label: 'Coincidencia', color: 'blue' },
  closed: { label: 'Cerrada', color: 'gray' },
} as const;

export type EnquiryStatus = keyof typeof ENQUIRY_STATUS;

export function getEnquiryStatusLabel(status: string): string {
  return ENQUIRY_STATUS[status as EnquiryStatus]?.label || status;
}

// Activity Types
export const ACTIVITY_TYPES = {
  call: { label: 'Llamada', icon: 'phone' },
  email: { label: 'Email', icon: 'mail' },
  whatsapp: { label: 'WhatsApp', icon: 'message-circle' },
  meeting: { label: 'Reunión', icon: 'users' },
  visit: { label: 'Visita', icon: 'home' },
  note: { label: 'Nota', icon: 'file-text' },
  status_change: { label: 'Cambio de estado', icon: 'refresh-cw' },
} as const;

export type ActivityType = keyof typeof ACTIVITY_TYPES;

export function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPES[type as ActivityType]?.label || type;
}

// Filter options for dropdowns
export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(LEAD_STATUS).map(([value, { label }]) => ({ value, label })),
];

export const SOURCE_FILTER_OPTIONS = [
  { value: '', label: 'Todas las fuentes' },
  ...Object.entries(LEAD_SOURCES).map(([value, { label }]) => ({ value, label })),
];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
