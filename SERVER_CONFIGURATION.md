# Configuracion del Servidor - HabitaCR CRM

Este documento detalla todas las configuraciones necesarias en el servidor para que el CRM funcione correctamente.

## 1. Variables de Entorno (.env)

Cree un archivo `.env.local` en `/frontend/` con las siguientes variables:

```env
# ===========================================
# BASE DE DATOS Y API
# ===========================================
NEXT_PUBLIC_WORDPRESS_URL=https://habitacr.com
NEXT_PUBLIC_GRAPHQL_URL=https://habitacr.com/graphql

# ===========================================
# AUTENTICACION
# ===========================================
NEXTAUTH_SECRET=<generar-clave-segura-aleatoria>
NEXTAUTH_URL=https://crm.habitacr.com

# ===========================================
# EMAIL - CUENTA PRINCIPAL
# ===========================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@habitacr.com
SMTP_PASSWORD=<password-de-info>
EMAIL_FROM="HabitaCR" <info@habitacr.com>

# ===========================================
# EMAIL - CUENTAS POR AGENTE
# Formato: SMTP_USER_<AGENT_ID> y SMTP_PASSWORD_<AGENT_ID>
# El AGENT_ID corresponde al databaseId del usuario en WordPress
# ===========================================

# Ejemplo Agente 1 (Carlos)
SMTP_USER_5=carlos@habitacr.com
SMTP_PASSWORD_5=<password-carlos>

# Ejemplo Agente 2 (Ana)
SMTP_USER_6=ana@habitacr.com
SMTP_PASSWORD_6=<password-ana>

# Ejemplo Agente 3 (Maria)
SMTP_USER_7=maria@habitacr.com
SMTP_PASSWORD_7=<password-maria>

# Agregue mas agentes segun sea necesario...

# ===========================================
# CALENDARIO
# ===========================================
NEXT_PUBLIC_CALENDAR_FEED_TOKEN=<token-seguro-para-feed>
CALDAV_URL=https://habitacr.com/calendar/html/dav.php/calendars/master/habitacr/
CALDAV_USER=master
CALDAV_PASSWORD=<password-caldav>

# ===========================================
# WHATSAPP (Opcional - para integracion directa)
# ===========================================
WHATSAPP_API_URL=https://api.whatsapp.com/send
WHATSAPP_BUSINESS_ID=<business-id>
WHATSAPP_ACCESS_TOKEN=<access-token>
```

## 2. Configuracion de Email por Agente

### Crear cuentas de email en Hostinger:

1. Acceda al panel de Hostinger
2. Vaya a **Email** > **Cuentas de correo**
3. Cree una cuenta para cada agente con el formato: `nombre@habitacr.com`
4. Guarde las contrasenas de forma segura

### Configuracion SMTP para cada agente:

| Parametro | Valor |
|-----------|-------|
| Servidor SMTP | smtp.hostinger.com |
| Puerto | 465 (SSL/TLS) |
| Autenticacion | Requerida |
| Usuario | correo@habitacr.com |
| Contrasena | (la del correo) |

### Vincular agente con su email:

1. Obtenga el `databaseId` del agente desde WordPress
2. Agregue las variables de entorno:
   ```env
   SMTP_USER_<ID>=correo@habitacr.com
   SMTP_PASSWORD_<ID>=<password>
   ```

## 3. Configuracion del Backend (WordPress)

### Plugin GraphQL

El backend usa WPGraphQL. Verifique que este instalado y activado:
- WPGraphQL
- WPGraphQL JWT Authentication

### Tablas personalizadas requeridas:

Las siguientes tablas deben existir en la base de datos de WordPress:

```sql
-- Tabla de Deals/Seguimientos
CREATE TABLE IF NOT EXISTS wp_crm_deals (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id BIGINT(20) UNSIGNED,
  lead_name VARCHAR(255),
  lead_email VARCHAR(255),
  lead_mobile VARCHAR(50),
  grupo VARCHAR(100),
  busca TEXT,
  estado VARCHAR(50) DEFAULT 'nuevo',
  calificacion VARCHAR(50),
  proximo_paso TEXT,
  propiedad TEXT,
  property_id BIGINT(20) UNSIGNED,
  detalles TEXT,
  fecha1 DATETIME,
  fecha2 DATETIME,
  visita_confirmada TINYINT(1) DEFAULT 0,
  agent_id BIGINT(20) UNSIGNED,
  agent_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY agent_id (agent_id),
  KEY estado (estado),
  KEY created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Leads
CREATE TABLE IF NOT EXISTS wp_crm_leads (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mobile VARCHAR(50),
  source VARCHAR(50) DEFAULT 'direct',
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  property_id BIGINT(20) UNSIGNED,
  agent_id BIGINT(20) UNSIGNED,
  agent_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY agent_id (agent_id),
  KEY status (status),
  KEY created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Notas
CREATE TABLE IF NOT EXISTS wp_crm_notes (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT(20) UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT 'default',
  user_id BIGINT(20) UNSIGNED,
  user_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY entity_type_id (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Audit Log (Panel de Accion)
CREATE TABLE IF NOT EXISTS wp_crm_audit_log (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT(20) UNSIGNED,
  entity_name VARCHAR(255),
  user_id BIGINT(20) UNSIGNED NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  details TEXT,
  previous_data LONGTEXT,
  new_data LONGTEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY action_type (action_type),
  KEY entity_type (entity_type),
  KEY created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de Registros Eliminados (para recuperacion)
CREATE TABLE IF NOT EXISTS wp_crm_deleted_records (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT(20) UNSIGNED NOT NULL,
  entity_name VARCHAR(255),
  data LONGTEXT NOT NULL,
  deleted_by BIGINT(20) UNSIGNED,
  deleted_by_name VARCHAR(255),
  deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  can_recover TINYINT(1) DEFAULT 1,
  PRIMARY KEY (id),
  KEY entity_type (entity_type),
  KEY deleted_at (deleted_at),
  KEY expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Triggers para Audit Log

Agregue estos triggers para registrar automaticamente las acciones:

```sql
-- Trigger para registrar eliminaciones de deals
DELIMITER //
CREATE TRIGGER after_deal_delete
BEFORE DELETE ON wp_crm_deals
FOR EACH ROW
BEGIN
  -- Guardar en audit log
  INSERT INTO wp_crm_audit_log (action_type, entity_type, entity_id, entity_name, user_id, user_name, previous_data, created_at)
  VALUES ('delete', 'deal', OLD.id, OLD.lead_name, @current_user_id, @current_user_name,
          JSON_OBJECT('lead_name', OLD.lead_name, 'lead_mobile', OLD.lead_mobile, 'estado', OLD.estado, 'propiedad', OLD.propiedad),
          NOW());

  -- Guardar copia para recuperacion
  INSERT INTO wp_crm_deleted_records (entity_type, entity_id, entity_name, data, deleted_by, deleted_at, expires_at)
  VALUES ('deal', OLD.id, OLD.lead_name,
          JSON_OBJECT('id', OLD.id, 'lead_name', OLD.lead_name, 'lead_email', OLD.lead_email,
                      'lead_mobile', OLD.lead_mobile, 'estado', OLD.estado, 'propiedad', OLD.propiedad,
                      'detalles', OLD.detalles, 'agent_id', OLD.agent_id),
          @current_user_id, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));
END//
DELIMITER ;

-- Trigger similar para leads
DELIMITER //
CREATE TRIGGER after_lead_delete
BEFORE DELETE ON wp_crm_leads
FOR EACH ROW
BEGIN
  INSERT INTO wp_crm_audit_log (action_type, entity_type, entity_id, entity_name, user_id, user_name, previous_data, created_at)
  VALUES ('delete', 'lead', OLD.id, OLD.name, @current_user_id, @current_user_name,
          JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'mobile', OLD.mobile, 'status', OLD.status),
          NOW());

  INSERT INTO wp_crm_deleted_records (entity_type, entity_id, entity_name, data, deleted_by, deleted_at, expires_at)
  VALUES ('lead', OLD.id, OLD.name,
          JSON_OBJECT('id', OLD.id, 'name', OLD.name, 'email', OLD.email, 'mobile', OLD.mobile,
                      'source', OLD.source, 'message', OLD.message, 'status', OLD.status, 'agent_id', OLD.agent_id),
          @current_user_id, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));
END//
DELIMITER ;
```

## 4. Actualizaciones al Plugin GraphQL

Agregue estos resolvers al plugin de WordPress para soportar las nuevas funcionalidades:

### Filtro por agentId en queries:

```php
// En el archivo de resolvers de deals
add_filter('graphql_deals_query_args', function($args, $source, $input) {
    // Si se proporciona agentId, filtrar por el
    if (!empty($input['agentId'])) {
        $args['meta_query'][] = [
            'key' => 'agent_id',
            'value' => $input['agentId'],
            'compare' => '='
        ];
    }
    return $args;
}, 10, 3);

// Lo mismo para leads
add_filter('graphql_leads_query_args', function($args, $source, $input) {
    if (!empty($input['agentId'])) {
        $args['meta_query'][] = [
            'key' => 'agent_id',
            'value' => $input['agentId'],
            'compare' => '='
        ];
    }
    return $args;
}, 10, 3);
```

### Query para Audit Logs:

```php
register_graphql_field('RootQuery', 'auditLogs', [
    'type' => ['list_of' => 'AuditLog'],
    'args' => [
        'first' => ['type' => 'Int'],
        'offset' => ['type' => 'Int'],
        'actionType' => ['type' => 'String'],
        'entityType' => ['type' => 'String'],
        'userId' => ['type' => 'ID'],
    ],
    'resolve' => function($root, $args) {
        global $wpdb;

        $where = '1=1';
        if (!empty($args['actionType'])) {
            $where .= $wpdb->prepare(' AND action_type = %s', $args['actionType']);
        }
        if (!empty($args['entityType'])) {
            $where .= $wpdb->prepare(' AND entity_type = %s', $args['entityType']);
        }
        if (!empty($args['userId'])) {
            $where .= $wpdb->prepare(' AND user_id = %d', $args['userId']);
        }

        $limit = !empty($args['first']) ? intval($args['first']) : 100;
        $offset = !empty($args['offset']) ? intval($args['offset']) : 0;

        $results = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}crm_audit_log
             WHERE {$where}
             ORDER BY created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );

        return $results;
    }
]);
```

### Mutation para recuperar registros:

```php
register_graphql_mutation('recoverRecord', [
    'inputFields' => [
        'id' => ['type' => 'ID!'],
        'entityType' => ['type' => 'String!'],
        'entityId' => ['type' => 'ID!'],
    ],
    'outputFields' => [
        'success' => ['type' => 'Boolean'],
        'message' => ['type' => 'String'],
        'entityId' => ['type' => 'ID'],
    ],
    'mutateAndGetPayload' => function($input) {
        global $wpdb;

        $record = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}crm_deleted_records WHERE id = %d",
            $input['id']
        ));

        if (!$record || !$record->can_recover) {
            return ['success' => false, 'message' => 'Registro no encontrado o no recuperable'];
        }

        $data = json_decode($record->data, true);
        $table = $wpdb->prefix . 'crm_' . $record->entity_type . 's';

        // Restaurar el registro
        $wpdb->insert($table, $data);
        $new_id = $wpdb->insert_id;

        // Marcar como recuperado
        $wpdb->update(
            $wpdb->prefix . 'crm_deleted_records',
            ['can_recover' => 0],
            ['id' => $input['id']]
        );

        // Registrar en audit log
        $wpdb->insert($wpdb->prefix . 'crm_audit_log', [
            'action_type' => 'recover',
            'entity_type' => $record->entity_type,
            'entity_id' => $new_id,
            'entity_name' => $record->entity_name,
            'user_id' => get_current_user_id(),
            'user_name' => wp_get_current_user()->display_name,
            'details' => 'Registro recuperado desde eliminados',
        ]);

        return [
            'success' => true,
            'message' => 'Registro recuperado exitosamente',
            'entityId' => $new_id
        ];
    }
]);
```

## 5. Permisos de Usuario

### Roles disponibles:

| Rol | Nivel | Permisos |
|-----|-------|----------|
| admin | 3 | Acceso total, Panel de Accion, configuracion |
| moderator | 2 | Ver todos los datos, gestionar leads/deals |
| agent | 1 | Solo sus propios datos |

### Configurar roles en WordPress:

```php
// Agregar capabilities personalizadas
function add_crm_capabilities() {
    $admin = get_role('administrator');
    $admin->add_cap('manage_crm');
    $admin->add_cap('view_all_leads');
    $admin->add_cap('view_audit_log');
    $admin->add_cap('recover_records');

    // Crear rol de moderador si no existe
    if (!get_role('crm_moderator')) {
        add_role('crm_moderator', 'CRM Moderator', [
            'read' => true,
            'view_all_leads' => true,
        ]);
    }

    // Crear rol de agente si no existe
    if (!get_role('crm_agent')) {
        add_role('crm_agent', 'CRM Agent', [
            'read' => true,
        ]);
    }
}
add_action('init', 'add_crm_capabilities');
```

## 6. Cron Jobs (Tareas Programadas)

### Limpiar registros eliminados viejos:

Agregue a `wp-config.php` o en un plugin:

```php
// Cron para limpiar registros eliminados mas viejos de 30 dias
if (!wp_next_scheduled('cleanup_deleted_records')) {
    wp_schedule_event(time(), 'daily', 'cleanup_deleted_records');
}

add_action('cleanup_deleted_records', function() {
    global $wpdb;
    $wpdb->query(
        "DELETE FROM {$wpdb->prefix}crm_deleted_records
         WHERE expires_at < NOW()"
    );
});
```

## 7. Seguridad

### Headers de seguridad (agregar en .htaccess o nginx):

```
# Para Apache (.htaccess)
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Para Nginx
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### Rate limiting para API de email:

```php
// Limitar envio de emails por usuario
function rate_limit_email_api($request) {
    $user_id = get_current_user_id();
    $key = 'email_rate_' . $user_id;
    $count = get_transient($key) ?: 0;

    if ($count >= 50) { // Max 50 emails por hora
        return new WP_Error('rate_limited', 'Demasiados emails enviados', ['status' => 429]);
    }

    set_transient($key, $count + 1, HOUR_IN_SECONDS);
    return $request;
}
```

## 8. Respaldos

### Configurar respaldos automaticos:

1. **Base de datos**: Programar respaldos diarios de MySQL
2. **Archivos**: Respaldar `/wp-content/uploads/`
3. **Configuracion**: Respaldar `.env` y `wp-config.php`

### Script de respaldo recomendado:

```bash
#!/bin/bash
# backup.sh - Ejecutar diariamente via cron

DATE=$(date +%Y%m%d)
BACKUP_DIR=/backups/habitacr

# Respaldar base de datos
mysqldump -u root habitacr_db > $BACKUP_DIR/db_$DATE.sql

# Respaldar uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/habitacr/wp-content/uploads

# Mantener solo ultimos 30 dias
find $BACKUP_DIR -mtime +30 -delete
```

## 9. Monitoreo

### Endpoints de health check:

- `/api/health` - Estado general del sistema
- `/api/email/status` - Estado del servicio de email

### Metricas a monitorear:

- Tiempo de respuesta de GraphQL
- Tasa de exito de envio de emails
- Uso de almacenamiento de base de datos
- Registros de audit log por dia

---

## Checklist de Implementacion

- [ ] Variables de entorno configuradas
- [ ] Cuentas de email creadas para cada agente
- [ ] Tablas de base de datos creadas
- [ ] Triggers de audit log instalados
- [ ] Resolvers de GraphQL actualizados
- [ ] Roles de usuario configurados
- [ ] Cron jobs programados
- [ ] Headers de seguridad configurados
- [ ] Respaldos automaticos funcionando
- [ ] Monitoreo activo

---

**Soporte**: Para cualquier problema con la configuracion, contacte al equipo de desarrollo.
