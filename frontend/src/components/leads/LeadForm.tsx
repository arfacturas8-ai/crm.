'use client';

import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CREATE_LEAD, UPDATE_LEAD } from '@/graphql/queries/leads';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { LEAD_SOURCE_LABELS, type Lead } from '@/types';

const leadSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  mobile: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  source: z.string().min(1, 'Fuente requerida'),
  message: z.string().optional(),
  status: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSuccess: () => void;
}

const SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'qualified', label: 'Calificado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'lost', label: 'Perdido' },
];

export function LeadForm({ lead, onSuccess }: LeadFormProps) {
  const { addNotification } = useUIStore();
  const isEditing = !!lead;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      mobile: lead?.mobile || '',
      source: lead?.source || 'website',
      message: lead?.message || '',
      status: lead?.status || 'new',
    },
  });

  const [createLead, { loading: createLoading }] = useMutation(CREATE_LEAD, {
    refetchQueries: ['GetLeads', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.createLead?.lead) {
        addNotification({
          type: 'success',
          title: 'Lead creado',
          message: 'El lead se ha creado correctamente',
        });
        onSuccess();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo crear el lead',
        });
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo crear el lead',
      });
    },
  });

  const [updateLead, { loading: updateLoading }] = useMutation(UPDATE_LEAD, {
    refetchQueries: ['GetLeads', 'GetLead', 'GetDashboardStats'],
    onCompleted: (data) => {
      if (data?.updateLead?.lead) {
        addNotification({
          type: 'success',
          title: 'Lead actualizado',
          message: 'El lead se ha actualizado correctamente',
        });
        onSuccess();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo actualizar el lead',
        });
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar el lead',
      });
    },
  });

  const loading = createLoading || updateLoading;

  const onSubmit = (data: LeadFormData) => {
    if (isEditing) {
      updateLead({
        variables: {
          input: {
            id: lead.id,
            ...data,
          },
        },
      });
    } else {
      createLead({
        variables: {
          input: data,
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          placeholder="Nombre completo"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Teléfono *"
          placeholder="8888-8888"
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="correo@ejemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Fuente *"
          options={SOURCE_OPTIONS}
          error={errors.source?.message}
          {...register('source')}
        />

        {isEditing && (
          <Select
            label="Estado"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        )}
      </div>

      <Textarea
        label="Mensaje / Notas"
        placeholder="Información adicional sobre el lead..."
        rows={4}
        error={errors.message?.message}
        {...register('message')}
      />

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          {isEditing ? 'Actualizar' : 'Crear Lead'}
        </Button>
      </div>
    </form>
  );
}
