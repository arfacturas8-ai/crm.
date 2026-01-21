'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType = 'call' | 'meeting' | 'visit' | 'task' | 'email' | 'whatsapp' | 'follow_up';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';
export type ActivityPriority = 'low' | 'medium' | 'high';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealTitle?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivitiesState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  completeActivity: (id: string) => void;
  getActivitiesByLead: (leadId: string) => Activity[];
  getActivitiesByDeal: (dealId: string) => Activity[];
  getActivitiesByDate: (date: string) => Activity[];
  getPendingActivities: () => Activity[];
  getOverdueActivities: () => Activity[];
}

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const now = new Date().toISOString();
        const newActivity: Activity = {
          ...activity,
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          activities: [newActivity, ...state.activities],
        }));
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((act) =>
            act.id === id
              ? { ...act, ...updates, updatedAt: new Date().toISOString() }
              : act
          ),
        }));
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((act) => act.id !== id),
        }));
      },

      completeActivity: (id) => {
        set((state) => ({
          activities: state.activities.map((act) =>
            act.id === id
              ? {
                  ...act,
                  status: 'completed' as ActivityStatus,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : act
          ),
        }));
      },

      getActivitiesByLead: (leadId) => {
        return get().activities.filter((act) => act.leadId === leadId);
      },

      getActivitiesByDeal: (dealId) => {
        return get().activities.filter((act) => act.dealId === dealId);
      },

      getActivitiesByDate: (date) => {
        return get().activities.filter((act) => act.dueDate === date);
      },

      getPendingActivities: () => {
        return get()
          .activities.filter((act) => act.status === 'pending')
          .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
      },

      getOverdueActivities: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().activities.filter(
          (act) => act.status === 'pending' && act.dueDate && act.dueDate < today
        );
      },
    }),
    {
      name: 'activities-storage',
    }
  )
);

// Activity type labels and icons
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Llamada',
  meeting: 'Reunion',
  visit: 'Visita',
  task: 'Tarea',
  email: 'Correo',
  whatsapp: 'WhatsApp',
  follow_up: 'Seguimiento',
};

export const ACTIVITY_PRIORITY_LABELS: Record<ActivityPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};
