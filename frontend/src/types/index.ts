// User Roles
export type UserRole = 'admin' | 'moderator' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Lead Types
export type LeadSource =
  | 'whatsapp'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'marketplace'
  | 'google'
  | 'direct'
  | 'sign';

export interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  source: LeadSource;
  message?: string;
  propertyId?: string;
  propertyTitle?: string;
  agentId?: string;
  agentName?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  updatedAt: string;
}

// Deal Types - matches server schema
export type DealStage =
  | 'nuevo'
  | 'contactado'
  | 'visita-programada'
  | 'seguimiento'
  | 'reserva'
  | 'formalizado'
  | 'descartado'
  | 'ganado'
  // Legacy stages for backwards compatibility
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'active'
  | 'initial_contact'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  // Lead info (stored directly in deal)
  leadId?: number;
  leadName?: string;
  leadEmail?: string;
  leadMobile?: string;
  // Deal fields
  group?: string;
  busca?: string;
  estado?: string;
  calificacion?: string;
  proximoPaso?: string;
  propiedad?: string;
  detalles?: string;
  fecha1?: string;
  fecha2?: string;
  visitaConfirmada?: boolean;
  agentId?: string | number;
  agentName?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: any[];
  activities?: any[];
  // Mapped fields for display compatibility
  stage?: string;
  title?: string;
  value?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  propertyTitle?: string;
}

// Enquiry Types
export interface Enquiry {
  id: string;
  leadId: string;
  leadName: string;
  searchCriteria: {
    propertyType?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  notes?: string;
  status: 'active' | 'matched' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Note Types
export interface Note {
  id: string;
  entityType: 'lead' | 'deal' | 'enquiry';
  entityId: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Activity Types
export type ActivityType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'visit'
  | 'note'
  | 'status_change';

export interface Activity {
  id: string;
  entityType: 'lead' | 'deal' | 'enquiry';
  entityId: string;
  type: ActivityType;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Message Types (WhatsApp/Email)
export interface Message {
  id: string;
  type: 'whatsapp' | 'email';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  leadId?: string;
  sentAt?: string;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
}

// Pagination
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Lead Source Labels (Spanish)
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  website: 'Sitio web',
  facebook: 'Facebook',
  instagram: 'Instagram',
  marketplace: 'Market Place',
  google: 'Google',
  direct: 'Directo',
  sign: 'Rótulo',
};

// Deal Stage Labels (Spanish)
export const DEAL_STAGE_LABELS: Record<string, string> = {
  // Current stages
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  'visita-programada': 'Visita Programada',
  seguimiento: 'Seguimiento',
  reserva: 'Reserva',
  formalizado: 'Formalizado',
  descartado: 'Descartado',
  ganado: 'Ganado',
  // Legacy stages
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  visit: 'Visita Programada',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
  active: 'Activo',
  initial_contact: 'Contacto Inicial',
  closed_won: 'Ganado',
  closed_lost: 'Perdido',
};
