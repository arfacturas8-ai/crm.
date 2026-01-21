'use client';

import { useState } from 'react';
import { GripVertical, Plus, Trash2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePipelineStore, type PipelineStage } from '@/store/pipeline-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const COLORS = [
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-cyan-500', label: 'Cian' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-purple-500', label: 'Morado' },
  { value: 'bg-pink-500', label: 'Rosa' },
  { value: 'bg-amber-500', label: 'Ambar' },
  { value: 'bg-orange-500', label: 'Naranja' },
  { value: 'bg-green-500', label: 'Verde' },
  { value: 'bg-red-500', label: 'Rojo' },
  { value: 'bg-gray-500', label: 'Gris' },
];

export function PipelineSettings() {
  const { stages, addStage, updateStage, removeStage, reorderStages, resetToDefaults } =
    usePipelineStore();
  const { addNotification, closeModal } = useUIStore();

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('bg-blue-500');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'El nombre de la etapa es requerido',
      });
      return;
    }

    const id = newStageName.toLowerCase().replace(/\s+/g, '_');
    if (stages.some((s) => s.id === id)) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ya existe una etapa con ese nombre',
      });
      return;
    }

    addStage({
      id,
      label: newStageName.trim(),
      color: newStageColor,
      type: 'active',
    });

    setNewStageName('');
    addNotification({
      type: 'success',
      title: 'Etapa agregada',
      message: `Se agrego la etapa "${newStageName.trim()}"`,
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderStages(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    if (confirm('¿Estas seguro de restablecer el pipeline a los valores por defecto?')) {
      resetToDefaults();
      addNotification({
        type: 'success',
        title: 'Pipeline restablecido',
        message: 'Se restablecio el pipeline a los valores por defecto',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Personaliza las etapas de tu pipeline de ventas. Arrastra para reordenar las etapas.
      </p>

      {/* Current stages */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-700">Etapas actuales</h3>
        <div className="space-y-2">
          {sortedStages.map((stage, index) => (
            <div
              key={stage.id}
              className={cn(
                'flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100',
                draggedIndex === index && 'opacity-50'
              )}
              draggable={!stage.isTerminal}
              onDragStart={() => !stage.isTerminal && handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {!stage.isTerminal ? (
                <GripVertical size={16} className="text-gray-400 cursor-grab" />
              ) : (
                <div className="w-4" />
              )}

              <div className={cn('w-4 h-4 rounded-full', stage.color)} />

              <Input
                value={stage.label}
                onChange={(e) => updateStage(stage.id, { label: e.target.value })}
                className="flex-1 h-8"
                disabled={stage.isTerminal}
              />

              {/* Color picker */}
              {!stage.isTerminal && (
                <select
                  value={stage.color}
                  onChange={(e) => updateStage(stage.id, { color: e.target.value })}
                  className="h-8 px-2 border rounded text-sm"
                >
                  {COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Delete button - disabled for terminal stages */}
              {!stage.isTerminal ? (
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la etapa "${stage.label}"?`)) {
                      removeStage(stage.id);
                      addNotification({
                        type: 'success',
                        title: 'Etapa eliminada',
                        message: `Se elimino la etapa "${stage.label}"`,
                      });
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                  {stage.type === 'won' ? 'Final (Ganado)' : 'Final (Perdido)'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add new stage */}
      <div className="space-y-2 pt-4 border-t">
        <h3 className="font-medium text-sm text-gray-700">Agregar nueva etapa</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Nombre de la etapa..."
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
          />
          <select
            value={newStageColor}
            onChange={(e) => setNewStageColor(e.target.value)}
            className="h-10 px-3 border rounded"
          >
            {COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
          <Button onClick={handleAddStage} leftIcon={<Plus size={16} />}>
            Agregar
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={handleReset} leftIcon={<RotateCcw size={16} />}>
          Restablecer
        </Button>
        <Button onClick={() => closeModal()} leftIcon={<Check size={16} />}>
          Guardar y cerrar
        </Button>
      </div>
    </div>
  );
}
