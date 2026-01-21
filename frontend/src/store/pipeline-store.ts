'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  order: number;
  isTerminal?: boolean; // Won/Lost stages
  type?: 'active' | 'won' | 'lost';
}

interface PipelineState {
  stages: PipelineStage[];
  setStages: (stages: PipelineStage[]) => void;
  addStage: (stage: Omit<PipelineStage, 'order'>) => void;
  updateStage: (id: string, updates: Partial<PipelineStage>) => void;
  removeStage: (id: string) => void;
  reorderStages: (sourceIndex: number, destinationIndex: number) => void;
  resetToDefaults: () => void;
}

// Default pipeline stages (similar to Wasi.co)
const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'new', label: 'Nuevo', color: 'bg-blue-500', order: 0, type: 'active' },
  { id: 'contacted', label: 'Contactado', color: 'bg-cyan-500', order: 1, type: 'active' },
  { id: 'qualified', label: 'Calificado', color: 'bg-indigo-500', order: 2, type: 'active' },
  { id: 'visit', label: 'Visita Programada', color: 'bg-purple-500', order: 3, type: 'active' },
  { id: 'proposal', label: 'Propuesta', color: 'bg-amber-500', order: 4, type: 'active' },
  { id: 'negotiation', label: 'Negociacion', color: 'bg-orange-500', order: 5, type: 'active' },
  { id: 'won', label: 'Ganado', color: 'bg-green-500', order: 6, isTerminal: true, type: 'won' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-500', order: 7, isTerminal: true, type: 'lost' },
];

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      stages: DEFAULT_STAGES,

      setStages: (stages) => set({ stages }),

      addStage: (stage) => {
        const { stages } = get();
        const maxOrder = Math.max(...stages.map((s) => s.order), -1);
        set({
          stages: [...stages, { ...stage, order: maxOrder + 1 }],
        });
      },

      updateStage: (id, updates) => {
        const { stages } = get();
        set({
          stages: stages.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        });
      },

      removeStage: (id) => {
        const { stages } = get();
        // Don't allow removing terminal stages
        const stage = stages.find((s) => s.id === id);
        if (stage?.isTerminal) return;
        set({
          stages: stages.filter((s) => s.id !== id),
        });
      },

      reorderStages: (sourceIndex, destinationIndex) => {
        const { stages } = get();
        const sorted = [...stages].sort((a, b) => a.order - b.order);
        const [removed] = sorted.splice(sourceIndex, 1);
        sorted.splice(destinationIndex, 0, removed);
        set({
          stages: sorted.map((s, i) => ({ ...s, order: i })),
        });
      },

      resetToDefaults: () => set({ stages: DEFAULT_STAGES }),
    }),
    {
      name: 'pipeline-config',
    }
  )
);

// Helper to map old stages to new ones
export const mapLegacyStage = (stage: string): string => {
  const legacyMap: Record<string, string> = {
    active: 'new',
    initial_contact: 'contacted',
    qualified: 'qualified',
    proposal: 'proposal',
    negotiation: 'negotiation',
    won: 'won',
    closed_won: 'won',
    lost: 'lost',
    closed_lost: 'lost',
  };
  return legacyMap[stage] || stage;
};
