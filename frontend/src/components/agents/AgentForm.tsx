'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { User, Mail, Phone, Briefcase, MapPin, Award } from 'lucide-react';
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
  agentMeta?: {
    email?: string;
    mobile?: string;
    phone?: string;
    whatsapp?: string;
    position?: string;
    licenseNumber?: string;
    companyName?: string;
    serviceAreas?: string;
    specialties?: string;
  };
}

interface AgentFormProps {
  agent?: Agent;
  onSuccess: () => void;
}

export function AgentForm({ agent, onSuccess }: AgentFormProps) {
  const isEditing = !!agent;

  const [formData, setFormData] = useState({
    title: agent?.title || '',
    email: agent?.agentMeta?.email || '',
    mobile: agent?.agentMeta?.mobile || '',
    phone: agent?.agentMeta?.phone || '',
    whatsapp: agent?.agentMeta?.whatsapp || '',
    position: agent?.agentMeta?.position || '',
    licenseNumber: agent?.agentMeta?.licenseNumber || '',
    companyName: agent?.agentMeta?.companyName || '',
    serviceAreas: agent?.agentMeta?.serviceAreas || '',
    specialties: agent?.agentMeta?.specialties || '',
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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const agentMeta = {
      email: formData.email || undefined,
      mobile: formData.mobile || undefined,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || formData.mobile || undefined,
      position: formData.position || undefined,
      licenseNumber: formData.licenseNumber || undefined,
      companyName: formData.companyName || undefined,
      serviceAreas: formData.serviceAreas || undefined,
      specialties: formData.specialties || undefined,
    };

    if (isEditing) {
      updateAgent({
        variables: {
          input: {
            id: agent.id,
            title: formData.title,
            agentMeta,
          },
        },
      });
    } else {
      createAgent({
        variables: {
          input: {
            title: formData.title,
            status: 'PUBLISH',
            agentMeta,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
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

        {/* Mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Celular
          </label>
          <Input
            type="tel"
            placeholder="+506 8888-8888"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            leftIcon={<Phone size={16} />}
            className="bg-white border-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefono oficina
          </label>
          <Input
            type="tel"
            placeholder="+506 2222-2222"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            leftIcon={<Phone size={16} />}
            className="bg-white border-gray-200"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp
          </label>
          <Input
            type="tel"
            placeholder="+506 8888-8888"
            value={formData.whatsapp}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            leftIcon={<Phone size={16} />}
            className="bg-white border-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Posicion / Cargo
          </label>
          <Input
            placeholder="Agente Inmobiliario"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
            leftIcon={<Briefcase size={16} />}
            className="bg-white border-gray-200"
          />
        </div>

        {/* License */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numero de Licencia
          </label>
          <Input
            placeholder="LIC-12345"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            leftIcon={<Award size={16} />}
            className="bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Empresa / Agencia
        </label>
        <Input
          placeholder="Nombre de la empresa"
          value={formData.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Service Areas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Areas de servicio
        </label>
        <Input
          placeholder="San Jose, Escazu, Santa Ana..."
          value={formData.serviceAreas}
          onChange={(e) => handleChange('serviceAreas', e.target.value)}
          leftIcon={<MapPin size={16} />}
          className="bg-white border-gray-200"
        />
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Especialidades
        </label>
        <Input
          placeholder="Residencial, Comercial, Lujo..."
          value={formData.specialties}
          onChange={(e) => handleChange('specialties', e.target.value)}
          className="bg-white border-gray-200"
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
