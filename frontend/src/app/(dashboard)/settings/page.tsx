'use client';

import { useState } from 'react';
import {
  Settings,
  Mail,
  MessageSquare,
  Users,
  Shield,
  Bell,
  Database,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';

export default function SettingsPage() {
  const { user, hasMinimumRole } = useAuthStore();
  const { addNotification } = useUIStore();
  const [saving, setSaving] = useState(false);

  // Only admins can access this page
  if (!hasMinimumRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    addNotification({
      type: 'success',
      title: 'Configuración guardada',
      message: 'Los cambios se han guardado correctamente',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración del sistema CRM
        </p>
      </div>

      {/* WhatsApp Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} className="text-whatsapp" />
            WhatsApp Business API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-whatsapp/10 rounded-full flex items-center justify-center">
                <MessageSquare size={20} className="text-whatsapp" />
              </div>
              <div>
                <p className="font-medium">Estado de la conexión</p>
                <p className="text-sm text-muted-foreground">
                  Meta WhatsApp Business API
                </p>
              </div>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <Check size={12} />
              Configurado
            </Badge>
          </div>

          <Input
            label="Phone Number ID"
            placeholder="Ingrese el ID del número de WhatsApp"
            helperText="Obtén este valor desde el panel de desarrolladores de Meta"
          />

          <Input
            label="Access Token"
            type="password"
            placeholder="••••••••••••••••"
            helperText="Token de acceso permanente de la API de WhatsApp"
          />

          <Input
            label="Business Account ID"
            placeholder="Ingrese el ID de la cuenta de negocio"
          />
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} className="text-primary" />
            Configuración de Correo (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Servidor SMTP"
              placeholder="smtp.gmail.com"
              defaultValue="smtp.gmail.com"
            />
            <Input
              label="Puerto SMTP"
              placeholder="587"
              defaultValue="587"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Usuario SMTP"
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Contraseña SMTP"
              type="password"
              placeholder="••••••••••••"
            />
          </div>

          <Input
            label="Correo de envío (From)"
            placeholder="noreply@tudominio.com"
            helperText="Este será el remitente de los correos enviados"
          />
        </CardContent>
      </Card>

      {/* GraphQL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} className="text-purple-500" />
            WordPress GraphQL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Database size={20} className="text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Conexión GraphQL</p>
                <p className="text-sm text-muted-foreground">
                  WordPress con WPGraphQL
                </p>
              </div>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <Check size={12} />
              Conectado
            </Badge>
          </div>

          <Input
            label="Endpoint GraphQL"
            placeholder="https://tu-sitio.com/graphql"
            helperText="URL del endpoint GraphQL de WordPress"
          />
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Roles de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-red-500" />
                  <span className="font-medium">Administrador</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso completo al sistema, configuración y gestión de usuarios
                </p>
              </div>
              <Badge variant="danger">Admin</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-yellow-500" />
                  <span className="font-medium">Moderador</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestión de leads, deals y búsquedas. Sin acceso a configuración
                </p>
              </div>
              <Badge variant="warning">Moderador</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-500" />
                  <span className="font-medium">Agente</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceso solo a leads y deals asignados
                </p>
              </div>
              <Badge variant="success">Agente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} className="text-orange-500" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium">Notificar nuevos leads</p>
                <p className="text-sm text-muted-foreground">
                  Enviar notificación cuando se registre un nuevo lead
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium">Recordatorios de seguimiento</p>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorios de deals pendientes de seguimiento
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium">Resumen diario</p>
                <p className="text-sm text-muted-foreground">
                  Enviar resumen diario de actividad por email
                </p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
