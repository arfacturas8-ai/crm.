'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { User, Mail, Lock, Shield } from 'lucide-react';
import { CREATE_USER, UPDATE_USER } from '@/graphql/queries/agents';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useUIStore } from '@/store/ui-store';

interface Agent {
  id: string;
  databaseId: number;
  name: string;
  email: string;
  roles: { nodes: { name: string }[] };
}

interface AgentFormProps {
  agent?: Agent;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agente' },
  { value: 'author', label: 'Agente (Author)' },
  { value: 'editor', label: 'Moderador' },
  { value: 'contributor', label: 'Agente Jr' },
];

export function AgentForm({ agent, onSuccess }: AgentFormProps) {
  const isEditing = !!agent;
  const currentRole = agent?.roles?.nodes?.[0]?.name || 'agent';

  const [formData, setFormData] = useState({
    name: agent?.name || '',
    email: agent?.email || '',
    password: '',
    confirmPassword: '',
    role: currentRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addNotification } = useUIStore();

  const [createUser, { loading: creating }] = useMutation(CREATE_USER, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Agente creado',
        message: `El agente ${formData.name} ha sido creado exitosamente`,
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

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'La contrasena es requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'La contrasena debe tener al menos 8 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contrasenas no coinciden';
      }
    } else {
      // When editing, password is optional but must match if provided
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contrasenas no coinciden';
      }
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'La contrasena debe tener al menos 8 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditing) {
      const input: any = {
        id: agent.id,
        displayName: formData.name,
        email: formData.email,
        roles: [formData.role],
      };

      if (formData.password) {
        input.password = formData.password;
      }

      updateUser({ variables: { input } });
    } else {
      // Generate username from email
      const username = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      createUser({
        variables: {
          input: {
            username,
            email: formData.email,
            displayName: formData.name,
            password: formData.password,
            roles: [formData.role],
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
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          leftIcon={<User size={16} />}
          error={errors.name}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          type="email"
          placeholder="email@ejemplo.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          leftIcon={<Mail size={16} />}
          error={errors.email}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rol *
        </label>
        <div className="relative">
          <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <Select
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEditing ? 'Nueva contrasena (dejar vacio para mantener)' : 'Contrasena *'}
        </label>
        <Input
          type="password"
          placeholder={isEditing ? 'Nueva contrasena (opcional)' : 'Minimo 8 caracteres'}
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          leftIcon={<Lock size={16} />}
          error={errors.password}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar contrasena {!isEditing && '*'}
        </label>
        <Input
          type="password"
          placeholder="Repetir contrasena"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          leftIcon={<Lock size={16} />}
          error={errors.confirmPassword}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Role descriptions */}
      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
        <p><strong>Agente:</strong> Puede gestionar sus propias propiedades y leads asignados</p>
        <p><strong>Moderador:</strong> Puede gestionar leads, deals y propiedades de todos</p>
        <p><strong>Agente Jr:</strong> Acceso limitado, solo visualizacion</p>
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
