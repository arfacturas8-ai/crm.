'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { User } from 'lucide-react';
import { CREATE_AGENT, UPDATE_AGENT } from '@/graphql/queries/agents';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store/ui-store';

interface Agent {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  content?: string;
}

interface AgentFormProps {
  agent?: Agent;
  onSuccess: () => void;
}

export function AgentForm({ agent, onSuccess }: AgentFormProps) {
  const isEditing = !!agent;

  const [formData, setFormData] = useState({
    title: agent?.title || '',
    content: agent?.content || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addNotification } = useUIStore();

  const [createAgent, { loading: creating }] = useMutation(CREATE_AGENT, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Agente creado',
        message: `El agente ${formData.title} ha sido creado exitosamente`,
      });
      onSuccess();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error al crear agente',
        message: error.message,
      });
    },
  });

  const [updateAgent, { loading: updating }] = useMutation(UPDATE_AGENT, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Agente actualizado',
        message: `Los datos del agente han sido actualizados`,
      });
      onSuccess();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error al actualizar',
        message: error.message,
      });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditing) {
      updateAgent({
        variables: {
          input: {
            id: agent.id,
            title: formData.title,
            content: formData.content,
          },
        },
      });
    } else {
      createAgent({
        variables: {
          input: {
            title: formData.title,
            content: formData.content,
            status: 'PUBLISH',
          },
        },
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre completo *
        </label>
        <Input
          placeholder="Nombre del agente"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          leftIcon={<User size={16} />}
          error={errors.title}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripcion / Bio
        </label>
        <textarea
          placeholder="Descripcion del agente..."
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="submit" isLoading={creating || updating}>
          {isEditing ? 'Guardar cambios' : 'Crear agente'}
        </Button>
      </div>
    </form>
  );
}
