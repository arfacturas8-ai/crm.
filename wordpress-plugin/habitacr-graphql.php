<?php
/**
 * Plugin Name: HabitaCR GraphQL Extension
 * Description: Extends WPGraphQL to expose Houzez CRM data (Leads, Deals, Enquiries, Notes, Activities)
 * Version: 2.2.0
 * Author: HabitaCR
 * Requires Plugins: wp-graphql
 */

if (!defined('ABSPATH')) {
    exit;
}

define('HABITACR_CRM_VERSION', '2.2.0');
define('HABITACR_CRM_DB_VERSION', '2.2.0');

// Check if WPGraphQL is active
add_action('plugins_loaded', function() {
    if (!class_exists('WPGraphQL')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p>HabitaCR GraphQL Extension requires WPGraphQL plugin to be installed and active.</p></div>';
        });
        return;
    }
});

// ============================================
// VERSION CHECK & MIGRATION
// ============================================

add_action('plugins_loaded', 'habitacr_check_version');

function habitacr_check_version() {
    $current_version = get_option('habitacr_crm_db_version', '1.0.0');

    if (version_compare($current_version, HABITACR_CRM_DB_VERSION, '<')) {
        habitacr_run_migrations();
        update_option('habitacr_crm_db_version', HABITACR_CRM_DB_VERSION);
    }
}

function habitacr_run_migrations() {
    habitacr_create_v2_tables();
    habitacr_add_soft_delete_columns();
    habitacr_setup_crm_roles();
}

// ============================================
// CRM ROLES & CAPABILITIES
// ============================================

function habitacr_setup_crm_roles() {
    // CRM Moderator - Can view all data, view audit log
    $moderator_caps = [
        'read' => true,
        'manage_crm' => true,
        'view_all_leads' => true,
        'view_all_deals' => true,
        'view_audit_log' => true,
        'edit_leads' => true,
        'edit_deals' => true,
        'delete_crm_records' => true,
    ];

    // Remove old role if exists and recreate
    remove_role('crm_moderator');
    add_role('crm_moderator', 'CRM Moderator', $moderator_caps);

    // CRM Agent - Can only see own data
    $agent_caps = [
        'read' => true,
        'manage_crm' => true,
        'edit_leads' => true,
        'edit_deals' => true,
    ];

    remove_role('crm_agent');
    add_role('crm_agent', 'CRM Agent', $agent_caps);

    // Give administrators all CRM capabilities
    $admin = get_role('administrator');
    if ($admin) {
        $admin->add_cap('manage_crm');
        $admin->add_cap('view_all_leads');
        $admin->add_cap('view_all_deals');
        $admin->add_cap('view_audit_log');
        $admin->add_cap('edit_leads');
        $admin->add_cap('edit_deals');
        $admin->add_cap('delete_crm_records');
        $admin->add_cap('recover_records');
        $admin->add_cap('hard_delete_records');
    }
}

// ============================================
// CAPABILITY CHECK HELPERS
// ============================================

function habitacr_can_view_all_leads() {
    return current_user_can('view_all_leads') || current_user_can('administrator');
}

function habitacr_can_view_all_deals() {
    return current_user_can('view_all_deals') || current_user_can('administrator');
}

function habitacr_can_view_audit_log() {
    return current_user_can('view_audit_log') || current_user_can('administrator');
}

function habitacr_can_recover_records() {
    return current_user_can('recover_records') || current_user_can('administrator');
}

function habitacr_can_hard_delete() {
    return current_user_can('hard_delete_records') || current_user_can('administrator');
}

function habitacr_can_delete_records() {
    return current_user_can('delete_crm_records') || current_user_can('administrator');
}

// ============================================
// DATABASE TABLES (v2.2.0)
// ============================================

function habitacr_create_v2_tables() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Audit Log table
    $audit_table = $wpdb->prefix . 'crm_audit_log';
    $sql_audit = "CREATE TABLE IF NOT EXISTS {$audit_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        action varchar(50) NOT NULL,
        entity_type varchar(50) NOT NULL,
        entity_id bigint(20) NOT NULL,
        entity_name varchar(255),
        user_id bigint(20) NOT NULL,
        user_name varchar(255),
        old_values longtext,
        new_values longtext,
        ip_address varchar(45),
        user_agent text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY action (action),
        KEY entity_type (entity_type),
        KEY entity_id (entity_id),
        KEY user_id (user_id),
        KEY created_at (created_at)
    ) {$charset_collate};";
    dbDelta($sql_audit);

    // Deleted Records table (for recovery)
    $deleted_table = $wpdb->prefix . 'crm_deleted_records';
    $sql_deleted = "CREATE TABLE IF NOT EXISTS {$deleted_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        entity_type varchar(50) NOT NULL,
        entity_id bigint(20) NOT NULL,
        entity_name varchar(255),
        data longtext NOT NULL,
        deleted_by bigint(20) NOT NULL,
        deleted_by_name varchar(255),
        deleted_at datetime DEFAULT CURRENT_TIMESTAMP,
        expires_at datetime NOT NULL,
        PRIMARY KEY (id),
        KEY entity_type (entity_type),
        KEY entity_id (entity_id),
        KEY deleted_at (deleted_at),
        KEY expires_at (expires_at)
    ) {$charset_collate};";
    dbDelta($sql_deleted);
}

function habitacr_add_soft_delete_columns() {
    global $wpdb;

    $leads_table = $wpdb->prefix . 'developer_starter_leads';
    $deals_table = $wpdb->prefix . 'developer_starter_deals';

    // Add deleted_at to leads
    $column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$leads_table} LIKE 'deleted_at'");
    if (empty($column_exists)) {
        $wpdb->query("ALTER TABLE {$leads_table} ADD COLUMN deleted_at datetime DEFAULT NULL");
        $wpdb->query("ALTER TABLE {$leads_table} ADD INDEX deleted_at (deleted_at)");
    }

    // Add deleted_at to deals
    $column_exists = $wpdb->get_results("SHOW COLUMNS FROM {$deals_table} LIKE 'deleted_at'");
    if (empty($column_exists)) {
        $wpdb->query("ALTER TABLE {$deals_table} ADD COLUMN deleted_at datetime DEFAULT NULL");
        $wpdb->query("ALTER TABLE {$deals_table} ADD INDEX deleted_at (deleted_at)");
    }
}

// ============================================
// AUDIT LOGGING
// ============================================

function habitacr_log_audit($action, $entity_type, $entity_id, $entity_name = '', $old_values = null, $new_values = null) {
    global $wpdb;
    $audit_table = $wpdb->prefix . 'crm_audit_log';

    $current_user = wp_get_current_user();

    $wpdb->insert($audit_table, [
        'action' => $action,
        'entity_type' => $entity_type,
        'entity_id' => $entity_id,
        'entity_name' => $entity_name,
        'user_id' => $current_user->ID,
        'user_name' => $current_user->display_name,
        'old_values' => $old_values ? json_encode($old_values) : null,
        'new_values' => $new_values ? json_encode($new_values) : null,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'created_at' => current_time('mysql'),
    ]);

    return $wpdb->insert_id;
}

// ============================================
// SOFT DELETE HELPERS
// ============================================

function habitacr_soft_delete_record($table, $id, $entity_type, $entity_name = '') {
    global $wpdb;
    $deleted_table = $wpdb->prefix . 'crm_deleted_records';

    // Get the full record before deleting
    $record = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id));
    if (!$record) {
        return false;
    }

    $current_user = wp_get_current_user();
    $expires_at = date('Y-m-d H:i:s', strtotime('+30 days'));

    // Store in deleted_records for recovery
    $wpdb->insert($deleted_table, [
        'entity_type' => $entity_type,
        'entity_id' => $id,
        'entity_name' => $entity_name ?: ($record->name ?? $record->lead_name ?? ''),
        'data' => json_encode($record),
        'deleted_by' => $current_user->ID,
        'deleted_by_name' => $current_user->display_name,
        'deleted_at' => current_time('mysql'),
        'expires_at' => $expires_at,
    ]);

    // Soft delete (set deleted_at)
    $wpdb->update($table, ['deleted_at' => current_time('mysql')], ['id' => $id]);

    // Log to audit
    habitacr_log_audit('delete', $entity_type, $id, $entity_name ?: ($record->name ?? $record->lead_name ?? ''), (array)$record, null);

    return true;
}

function habitacr_recover_record($entity_type, $entity_id) {
    global $wpdb;
    $deleted_table = $wpdb->prefix . 'crm_deleted_records';

    // Get deleted record
    $deleted = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$deleted_table} WHERE entity_type = %s AND entity_id = %d ORDER BY deleted_at DESC LIMIT 1",
        $entity_type, $entity_id
    ));

    if (!$deleted) {
        return ['success' => false, 'message' => 'Record not found in deleted records'];
    }

    // Determine target table
    $table = '';
    if ($entity_type === 'lead') {
        $table = $wpdb->prefix . 'developer_starter_leads';
    } elseif ($entity_type === 'deal') {
        $table = $wpdb->prefix . 'developer_starter_deals';
    } else {
        return ['success' => false, 'message' => 'Unknown entity type'];
    }

    // Clear deleted_at to restore
    $wpdb->update($table, ['deleted_at' => null], ['id' => $entity_id]);

    // Remove from deleted_records
    $wpdb->delete($deleted_table, ['id' => $deleted->id]);

    // Log recovery
    habitacr_log_audit('recover', $entity_type, $entity_id, $deleted->entity_name);

    return ['success' => true, 'message' => 'Record recovered successfully'];
}

// ============================================
// CRON JOB FOR CLEANUP
// ============================================

register_activation_hook(__FILE__, 'habitacr_schedule_cleanup');
register_deactivation_hook(__FILE__, 'habitacr_unschedule_cleanup');

function habitacr_schedule_cleanup() {
    if (!wp_next_scheduled('habitacr_daily_cleanup')) {
        wp_schedule_event(time(), 'daily', 'habitacr_daily_cleanup');
    }
}

function habitacr_unschedule_cleanup() {
    wp_clear_scheduled_hook('habitacr_daily_cleanup');
}

add_action('habitacr_daily_cleanup', 'habitacr_cleanup_expired_records');

function habitacr_cleanup_expired_records() {
    global $wpdb;

    $leads_table = $wpdb->prefix . 'developer_starter_leads';
    $deals_table = $wpdb->prefix . 'developer_starter_deals';
    $deleted_table = $wpdb->prefix . 'crm_deleted_records';

    $now = current_time('mysql');

    // Get expired records
    $expired = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$deleted_table} WHERE expires_at < %s",
        $now
    ));

    foreach ($expired as $record) {
        // Hard delete from main table
        if ($record->entity_type === 'lead') {
            $wpdb->delete($leads_table, ['id' => $record->entity_id]);
        } elseif ($record->entity_type === 'deal') {
            $wpdb->delete($deals_table, ['id' => $record->entity_id]);
        }

        // Remove from deleted_records
        $wpdb->delete($deleted_table, ['id' => $record->id]);

        // Log permanent deletion
        habitacr_log_audit('permanent_delete', $record->entity_type, $record->entity_id, $record->entity_name);
    }

    return count($expired);
}

// Register GraphQL Types and Fields
add_action('graphql_register_types', function() {
    global $wpdb;

    $leads_table = $wpdb->prefix . 'developer_starter_leads';
    $deals_table = $wpdb->prefix . 'developer_starter_deals';
    $enquiries_table = $wpdb->prefix . 'developer_starter_enquiries';
    $notes_table = $wpdb->prefix . 'developer_starter_notes';
    $activities_table = $wpdb->prefix . 'developer_starter_activities';
    $audit_table = $wpdb->prefix . 'crm_audit_log';
    $deleted_table = $wpdb->prefix . 'crm_deleted_records';

    // ============================================
    // ENUM TYPES
    // ============================================

    register_graphql_enum_type('LeadStatusEnum', [
        'description' => 'Lead status',
        'values' => [
            'NEW' => ['value' => 'new'],
            'CONTACTED' => ['value' => 'contacted'],
            'QUALIFIED' => ['value' => 'qualified'],
            'CONVERTED' => ['value' => 'converted'],
            'LOST' => ['value' => 'lost'],
        ],
    ]);

    register_graphql_enum_type('LeadSourceEnum', [
        'description' => 'Lead source',
        'values' => [
            'WEBSITE' => ['value' => 'website'],
            'WHATSAPP' => ['value' => 'whatsapp'],
            'FACEBOOK' => ['value' => 'facebook'],
            'INSTAGRAM' => ['value' => 'instagram'],
            'REFERRAL' => ['value' => 'referral'],
            'COLD_CALL' => ['value' => 'cold_call'],
            'OTHER' => ['value' => 'other'],
        ],
    ]);

    register_graphql_enum_type('DealGroupEnum', [
        'description' => 'Deal group/stage',
        'values' => [
            'ACTIVE' => ['value' => 'active'],
            'WON' => ['value' => 'won'],
            'LOST' => ['value' => 'lost'],
        ],
    ]);

    // ============================================
    // OBJECT TYPES
    // ============================================

    // Lead Type
    register_graphql_object_type('Lead', [
        'description' => 'CRM Lead',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Lead ID'],
            'name' => ['type' => 'String', 'description' => 'Lead name'],
            'email' => ['type' => 'String', 'description' => 'Lead email'],
            'mobile' => ['type' => 'String', 'description' => 'Lead mobile phone'],
            'message' => ['type' => 'String', 'description' => 'Lead message'],
            'source' => ['type' => 'String', 'description' => 'Lead source'],
            'status' => ['type' => 'String', 'description' => 'Lead status'],
            'propertyId' => ['type' => 'Int', 'description' => 'Associated property ID'],
            'propertyTitle' => ['type' => 'String', 'description' => 'Associated property title'],
            'agentId' => ['type' => 'Int', 'description' => 'Assigned agent ID'],
            'agentName' => ['type' => 'String', 'description' => 'Assigned agent name'],
            'createdAt' => ['type' => 'String', 'description' => 'Creation date'],
            'updatedAt' => ['type' => 'String', 'description' => 'Last update date'],
            'deletedAt' => ['type' => 'String', 'description' => 'Deletion date (soft delete)'],
            'notes' => ['type' => ['list_of' => 'Note'], 'description' => 'Lead notes'],
            'activities' => ['type' => ['list_of' => 'Activity'], 'description' => 'Lead activities'],
        ],
    ]);

    // Deal Type
    register_graphql_object_type('Deal', [
        'description' => 'CRM Deal',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Deal ID'],
            'leadId' => ['type' => 'Int', 'description' => 'Associated lead ID'],
            'leadName' => ['type' => 'String', 'description' => 'Lead name'],
            'leadEmail' => ['type' => 'String', 'description' => 'Lead email'],
            'leadMobile' => ['type' => 'String', 'description' => 'Lead mobile'],
            'group' => ['type' => 'String', 'description' => 'Deal group/stage'],
            'busca' => ['type' => 'String', 'description' => 'What client is looking for'],
            'estado' => ['type' => 'String', 'description' => 'Deal status'],
            'calificacion' => ['type' => 'String', 'description' => 'Deal qualification'],
            'proximoPaso' => ['type' => 'String', 'description' => 'Next step'],
            'propiedad' => ['type' => 'String', 'description' => 'Property of interest'],
            'detalles' => ['type' => 'String', 'description' => 'Deal details'],
            'fecha1' => ['type' => 'String', 'description' => 'Date 1'],
            'fecha2' => ['type' => 'String', 'description' => 'Date 2'],
            'visitaConfirmada' => ['type' => 'Boolean', 'description' => 'Visit confirmed'],
            'agentId' => ['type' => 'Int', 'description' => 'Assigned agent ID'],
            'agentName' => ['type' => 'String', 'description' => 'Assigned agent name'],
            'createdAt' => ['type' => 'String', 'description' => 'Creation date'],
            'updatedAt' => ['type' => 'String', 'description' => 'Last update date'],
            'deletedAt' => ['type' => 'String', 'description' => 'Deletion date (soft delete)'],
            'notes' => ['type' => ['list_of' => 'Note'], 'description' => 'Deal notes'],
            'activities' => ['type' => ['list_of' => 'Activity'], 'description' => 'Deal activities'],
        ],
    ]);

    // Enquiry Type
    register_graphql_object_type('Enquiry', [
        'description' => 'CRM Enquiry/Search',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Enquiry ID'],
            'leadId' => ['type' => 'Int', 'description' => 'Associated lead ID'],
            'leadName' => ['type' => 'String', 'description' => 'Lead name'],
            'tipo' => ['type' => 'String', 'description' => 'Property type'],
            'presupuestoMin' => ['type' => 'Float', 'description' => 'Minimum budget'],
            'presupuestoMax' => ['type' => 'Float', 'description' => 'Maximum budget'],
            'ubicaciones' => ['type' => 'String', 'description' => 'Preferred locations'],
            'habitaciones' => ['type' => 'Int', 'description' => 'Number of bedrooms'],
            'banos' => ['type' => 'Int', 'description' => 'Number of bathrooms'],
            'amenidades' => ['type' => 'String', 'description' => 'Desired amenities'],
            'notas' => ['type' => 'String', 'description' => 'Additional notes'],
            'createdAt' => ['type' => 'String', 'description' => 'Creation date'],
            'updatedAt' => ['type' => 'String', 'description' => 'Last update date'],
        ],
    ]);

    // Note Type
    register_graphql_object_type('Note', [
        'description' => 'CRM Note',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Note ID'],
            'content' => ['type' => 'String', 'description' => 'Note content'],
            'leadId' => ['type' => 'Int', 'description' => 'Associated lead ID'],
            'dealId' => ['type' => 'Int', 'description' => 'Associated deal ID'],
            'authorId' => ['type' => 'Int', 'description' => 'Author user ID'],
            'authorName' => ['type' => 'String', 'description' => 'Author name'],
            'createdAt' => ['type' => 'String', 'description' => 'Creation date'],
        ],
    ]);

    // Activity Type
    register_graphql_object_type('Activity', [
        'description' => 'CRM Activity',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Activity ID'],
            'type' => ['type' => 'String', 'description' => 'Activity type'],
            'description' => ['type' => 'String', 'description' => 'Activity description'],
            'leadId' => ['type' => 'Int', 'description' => 'Associated lead ID'],
            'dealId' => ['type' => 'Int', 'description' => 'Associated deal ID'],
            'userId' => ['type' => 'Int', 'description' => 'User who performed the activity'],
            'userName' => ['type' => 'String', 'description' => 'User name'],
            'createdAt' => ['type' => 'String', 'description' => 'Creation date'],
        ],
    ]);

    // Audit Log Type (NEW in v2.2.0)
    register_graphql_object_type('AuditLog', [
        'description' => 'CRM Audit Log Entry',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Log ID'],
            'action' => ['type' => 'String', 'description' => 'Action performed (create, update, delete, recover)'],
            'entityType' => ['type' => 'String', 'description' => 'Entity type (lead, deal)'],
            'entityId' => ['type' => 'Int', 'description' => 'Entity ID'],
            'entityName' => ['type' => 'String', 'description' => 'Entity name for display'],
            'userId' => ['type' => 'Int', 'description' => 'User who performed the action'],
            'userName' => ['type' => 'String', 'description' => 'User name'],
            'oldValues' => ['type' => 'String', 'description' => 'Previous values (JSON)'],
            'newValues' => ['type' => 'String', 'description' => 'New values (JSON)'],
            'ipAddress' => ['type' => 'String', 'description' => 'IP address'],
            'createdAt' => ['type' => 'String', 'description' => 'Timestamp'],
        ],
    ]);

    // Deleted Record Type (NEW in v2.2.0)
    register_graphql_object_type('DeletedRecord', [
        'description' => 'Recoverable deleted record',
        'fields' => [
            'id' => ['type' => 'ID', 'description' => 'Recovery record ID'],
            'entityType' => ['type' => 'String', 'description' => 'Entity type (lead, deal)'],
            'entityId' => ['type' => 'Int', 'description' => 'Original entity ID'],
            'entityName' => ['type' => 'String', 'description' => 'Entity name'],
            'deletedBy' => ['type' => 'Int', 'description' => 'User who deleted'],
            'deletedByName' => ['type' => 'String', 'description' => 'Deleter name'],
            'deletedAt' => ['type' => 'String', 'description' => 'Deletion timestamp'],
            'expiresAt' => ['type' => 'String', 'description' => 'Expiration date (permanent delete)'],
            'daysRemaining' => ['type' => 'Int', 'description' => 'Days until permanent deletion'],
        ],
    ]);

    // Connection/List Types
    register_graphql_object_type('LeadConnection', [
        'description' => 'Paginated list of leads',
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'Lead']],
            'totalCount' => ['type' => 'Int'],
            'pageInfo' => ['type' => 'PageInfoCustom'],
        ],
    ]);

    register_graphql_object_type('DealConnection', [
        'description' => 'Paginated list of deals',
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'Deal']],
            'totalCount' => ['type' => 'Int'],
            'pageInfo' => ['type' => 'PageInfoCustom'],
        ],
    ]);

    register_graphql_object_type('EnquiryConnection', [
        'description' => 'Paginated list of enquiries',
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'Enquiry']],
            'totalCount' => ['type' => 'Int'],
            'pageInfo' => ['type' => 'PageInfoCustom'],
        ],
    ]);

    register_graphql_object_type('AuditLogConnection', [
        'description' => 'Paginated audit logs',
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'AuditLog']],
            'totalCount' => ['type' => 'Int'],
            'pageInfo' => ['type' => 'PageInfoCustom'],
        ],
    ]);

    register_graphql_object_type('DeletedRecordConnection', [
        'description' => 'Paginated deleted records',
        'fields' => [
            'nodes' => ['type' => ['list_of' => 'DeletedRecord']],
            'totalCount' => ['type' => 'Int'],
            'pageInfo' => ['type' => 'PageInfoCustom'],
        ],
    ]);

    register_graphql_object_type('PageInfoCustom', [
        'description' => 'Pagination info',
        'fields' => [
            'hasNextPage' => ['type' => 'Boolean'],
            'hasPreviousPage' => ['type' => 'Boolean'],
            'total' => ['type' => 'Int'],
        ],
    ]);

    // Stats Type
    register_graphql_object_type('CRMStats', [
        'description' => 'CRM Statistics',
        'fields' => [
            'totalLeads' => ['type' => 'Int'],
            'totalDeals' => ['type' => 'Int'],
            'activeDeals' => ['type' => 'Int'],
            'wonDeals' => ['type' => 'Int'],
            'newLeadsThisMonth' => ['type' => 'Int'],
            'conversionRate' => ['type' => 'Float'],
        ],
    ]);

    // ============================================
    // INPUT TYPES
    // ============================================

    register_graphql_input_type('CreateLeadInput', [
        'description' => 'Input for creating a lead',
        'fields' => [
            'name' => ['type' => ['non_null' => 'String']],
            'email' => ['type' => 'String'],
            'mobile' => ['type' => ['non_null' => 'String']],
            'message' => ['type' => 'String'],
            'source' => ['type' => 'String'],
            'status' => ['type' => 'String'],
            'propertyId' => ['type' => 'Int'],
            'agentId' => ['type' => 'Int'],
        ],
    ]);

    register_graphql_input_type('UpdateLeadInput', [
        'description' => 'Input for updating a lead',
        'fields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'name' => ['type' => 'String'],
            'email' => ['type' => 'String'],
            'mobile' => ['type' => 'String'],
            'message' => ['type' => 'String'],
            'source' => ['type' => 'String'],
            'status' => ['type' => 'String'],
            'propertyId' => ['type' => 'Int'],
            'agentId' => ['type' => 'Int'],
        ],
    ]);

    register_graphql_input_type('CreateDealInput', [
        'description' => 'Input for creating a deal',
        'fields' => [
            'leadId' => ['type' => 'Int'],
            'leadName' => ['type' => ['non_null' => 'String']],
            'leadEmail' => ['type' => 'String'],
            'leadMobile' => ['type' => ['non_null' => 'String']],
            'group' => ['type' => 'String'],
            'busca' => ['type' => 'String'],
            'estado' => ['type' => 'String'],
            'calificacion' => ['type' => 'String'],
            'proximoPaso' => ['type' => 'String'],
            'propiedad' => ['type' => 'String'],
            'detalles' => ['type' => 'String'],
            'agentId' => ['type' => 'Int'],
        ],
    ]);

    register_graphql_input_type('UpdateDealInput', [
        'description' => 'Input for updating a deal',
        'fields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'group' => ['type' => 'String'],
            'busca' => ['type' => 'String'],
            'estado' => ['type' => 'String'],
            'calificacion' => ['type' => 'String'],
            'proximoPaso' => ['type' => 'String'],
            'propiedad' => ['type' => 'String'],
            'detalles' => ['type' => 'String'],
            'fecha1' => ['type' => 'String'],
            'fecha2' => ['type' => 'String'],
            'visitaConfirmada' => ['type' => 'Boolean'],
            'agentId' => ['type' => 'Int'],
        ],
    ]);

    register_graphql_input_type('CreateEnquiryInput', [
        'description' => 'Input for creating an enquiry',
        'fields' => [
            'leadId' => ['type' => ['non_null' => 'Int']],
            'tipo' => ['type' => 'String'],
            'presupuestoMin' => ['type' => 'Float'],
            'presupuestoMax' => ['type' => 'Float'],
            'ubicaciones' => ['type' => 'String'],
            'habitaciones' => ['type' => 'Int'],
            'banos' => ['type' => 'Int'],
            'amenidades' => ['type' => 'String'],
            'notas' => ['type' => 'String'],
        ],
    ]);

    register_graphql_input_type('CreateNoteInput', [
        'description' => 'Input for creating a note',
        'fields' => [
            'content' => ['type' => ['non_null' => 'String']],
            'leadId' => ['type' => 'Int'],
            'dealId' => ['type' => 'Int'],
        ],
    ]);

    // ============================================
    // QUERIES
    // ============================================

    // Get all leads (excludes soft-deleted)
    register_graphql_field('RootQuery', 'leads', [
        'type' => 'LeadConnection',
        'description' => 'Get all leads',
        'args' => [
            'first' => ['type' => 'Int', 'defaultValue' => 20],
            'offset' => ['type' => 'Int', 'defaultValue' => 0],
            'status' => ['type' => 'String'],
            'source' => ['type' => 'String'],
            'search' => ['type' => 'String'],
            'agentId' => ['type' => 'Int'],
            'includeDeleted' => ['type' => 'Boolean', 'defaultValue' => false],
        ],
        'resolve' => function($root, $args, $context, $info) use ($leads_table) {
            global $wpdb;

            $where = ['1=1'];
            $params = [];

            // Exclude soft-deleted unless specifically requested
            if (empty($args['includeDeleted'])) {
                $where[] = 'deleted_at IS NULL';
            }

            if (!empty($args['status'])) {
                $where[] = 'status = %s';
                $params[] = $args['status'];
            }
            if (!empty($args['source'])) {
                $where[] = 'source = %s';
                $params[] = $args['source'];
            }
            if (!empty($args['search'])) {
                $where[] = '(name LIKE %s OR email LIKE %s OR mobile LIKE %s)';
                $search = '%' . $wpdb->esc_like($args['search']) . '%';
                $params[] = $search;
                $params[] = $search;
                $params[] = $search;
            }
            if (!empty($args['agentId'])) {
                $where[] = 'agent_id = %d';
                $params[] = $args['agentId'];
            }

            $where_sql = implode(' AND ', $where);

            // Get total count
            $count_sql = "SELECT COUNT(*) FROM {$leads_table} WHERE {$where_sql}";
            if (!empty($params)) {
                $count_sql = $wpdb->prepare($count_sql, $params);
            }
            $total = (int) $wpdb->get_var($count_sql);

            // Get leads
            $sql = "SELECT * FROM {$leads_table} WHERE {$where_sql} ORDER BY created_at DESC LIMIT %d OFFSET %d";
            $params[] = $args['first'];
            $params[] = $args['offset'];

            $results = $wpdb->get_results($wpdb->prepare($sql, $params));

            $leads = array_map(function($row) {
                return format_lead($row);
            }, $results);

            return [
                'nodes' => $leads,
                'totalCount' => $total,
                'pageInfo' => [
                    'hasNextPage' => ($args['offset'] + $args['first']) < $total,
                    'hasPreviousPage' => $args['offset'] > 0,
                    'total' => $total,
                ],
            ];
        },
    ]);

    // Get single lead
    register_graphql_field('RootQuery', 'lead', [
        'type' => 'Lead',
        'description' => 'Get a single lead by ID',
        'args' => [
            'id' => ['type' => ['non_null' => 'ID']],
        ],
        'resolve' => function($root, $args, $context, $info) use ($leads_table) {
            global $wpdb;
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$leads_table} WHERE id = %d AND deleted_at IS NULL",
                $args['id']
            ));
            return $row ? format_lead($row) : null;
        },
    ]);

    // Get all deals (excludes soft-deleted)
    register_graphql_field('RootQuery', 'deals', [
        'type' => 'DealConnection',
        'description' => 'Get all deals',
        'args' => [
            'first' => ['type' => 'Int', 'defaultValue' => 20],
            'offset' => ['type' => 'Int', 'defaultValue' => 0],
            'group' => ['type' => 'String'],
            'estado' => ['type' => 'String'],
            'search' => ['type' => 'String'],
            'agentId' => ['type' => 'Int'],
            'includeDeleted' => ['type' => 'Boolean', 'defaultValue' => false],
        ],
        'resolve' => function($root, $args, $context, $info) use ($deals_table) {
            global $wpdb;

            $where = ['1=1'];
            $params = [];

            // Exclude soft-deleted unless specifically requested
            if (empty($args['includeDeleted'])) {
                $where[] = 'deleted_at IS NULL';
            }

            if (!empty($args['group'])) {
                $where[] = '`group` = %s';
                $params[] = $args['group'];
            }
            if (!empty($args['estado'])) {
                $where[] = 'estado = %s';
                $params[] = $args['estado'];
            }
            if (!empty($args['search'])) {
                $where[] = '(lead_name LIKE %s OR lead_email LIKE %s)';
                $search = '%' . $wpdb->esc_like($args['search']) . '%';
                $params[] = $search;
                $params[] = $search;
            }
            if (!empty($args['agentId'])) {
                $where[] = 'agent_id = %d';
                $params[] = $args['agentId'];
            }

            $where_sql = implode(' AND ', $where);

            // Get total count
            $count_sql = "SELECT COUNT(*) FROM {$deals_table} WHERE {$where_sql}";
            if (!empty($params)) {
                $count_sql = $wpdb->prepare($count_sql, $params);
            }
            $total = (int) $wpdb->get_var($count_sql);

            // Get deals
            $sql = "SELECT * FROM {$deals_table} WHERE {$where_sql} ORDER BY created_at DESC LIMIT %d OFFSET %d";
            $params[] = $args['first'];
            $params[] = $args['offset'];

            $results = $wpdb->get_results($wpdb->prepare($sql, $params));

            $deals = array_map(function($row) {
                return format_deal($row);
            }, $results);

            return [
                'nodes' => $deals,
                'totalCount' => $total,
                'pageInfo' => [
                    'hasNextPage' => ($args['offset'] + $args['first']) < $total,
                    'hasPreviousPage' => $args['offset'] > 0,
                    'total' => $total,
                ],
            ];
        },
    ]);

    // Get single deal
    register_graphql_field('RootQuery', 'deal', [
        'type' => 'Deal',
        'description' => 'Get a single deal by ID',
        'args' => [
            'id' => ['type' => ['non_null' => 'ID']],
        ],
        'resolve' => function($root, $args, $context, $info) use ($deals_table) {
            global $wpdb;
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM {$deals_table} WHERE id = %d AND deleted_at IS NULL",
                $args['id']
            ));
            return $row ? format_deal($row) : null;
        },
    ]);

    // Get all enquiries
    register_graphql_field('RootQuery', 'enquiries', [
        'type' => 'EnquiryConnection',
        'description' => 'Get all enquiries',
        'args' => [
            'first' => ['type' => 'Int', 'defaultValue' => 20],
            'offset' => ['type' => 'Int', 'defaultValue' => 0],
            'leadId' => ['type' => 'Int'],
        ],
        'resolve' => function($root, $args, $context, $info) use ($enquiries_table) {
            global $wpdb;

            $where = ['1=1'];
            $params = [];

            if (!empty($args['leadId'])) {
                $where[] = 'lead_id = %d';
                $params[] = $args['leadId'];
            }

            $where_sql = implode(' AND ', $where);

            $count_sql = "SELECT COUNT(*) FROM {$enquiries_table} WHERE {$where_sql}";
            if (!empty($params)) {
                $count_sql = $wpdb->prepare($count_sql, $params);
            }
            $total = (int) $wpdb->get_var($count_sql);

            $sql = "SELECT * FROM {$enquiries_table} WHERE {$where_sql} ORDER BY created_at DESC LIMIT %d OFFSET %d";
            $params[] = $args['first'];
            $params[] = $args['offset'];

            $results = $wpdb->get_results($wpdb->prepare($sql, $params));

            $enquiries = array_map(function($row) {
                return format_enquiry($row);
            }, $results);

            return [
                'nodes' => $enquiries,
                'totalCount' => $total,
                'pageInfo' => [
                    'hasNextPage' => ($args['offset'] + $args['first']) < $total,
                    'hasPreviousPage' => $args['offset'] > 0,
                    'total' => $total,
                ],
            ];
        },
    ]);

    // Get CRM Stats (excludes soft-deleted)
    register_graphql_field('RootQuery', 'crmStats', [
        'type' => 'CRMStats',
        'description' => 'Get CRM statistics',
        'resolve' => function($root, $args, $context, $info) use ($leads_table, $deals_table) {
            global $wpdb;

            $totalLeads = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$leads_table} WHERE deleted_at IS NULL");
            $totalDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table} WHERE deleted_at IS NULL");
            $activeDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table} WHERE `group` = 'active' AND deleted_at IS NULL");
            $wonDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table} WHERE `group` = 'won' AND deleted_at IS NULL");

            $firstOfMonth = date('Y-m-01 00:00:00');
            $newLeadsThisMonth = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$leads_table} WHERE created_at >= %s AND deleted_at IS NULL",
                $firstOfMonth
            ));

            $conversionRate = $totalLeads > 0 ? round(($wonDeals / $totalLeads) * 100, 2) : 0;

            return [
                'totalLeads' => $totalLeads,
                'totalDeals' => $totalDeals,
                'activeDeals' => $activeDeals,
                'wonDeals' => $wonDeals,
                'newLeadsThisMonth' => $newLeadsThisMonth,
                'conversionRate' => $conversionRate,
            ];
        },
    ]);

    // Get Audit Logs (Admin only) - NEW in v2.2.0
    register_graphql_field('RootQuery', 'auditLogs', [
        'type' => 'AuditLogConnection',
        'description' => 'Get audit logs (admin/moderator only)',
        'args' => [
            'first' => ['type' => 'Int', 'defaultValue' => 50],
            'offset' => ['type' => 'Int', 'defaultValue' => 0],
            'action' => ['type' => 'String'],
            'entityType' => ['type' => 'String'],
            'entityId' => ['type' => 'Int'],
            'userId' => ['type' => 'Int'],
        ],
        'resolve' => function($root, $args, $context, $info) use ($audit_table) {
            global $wpdb;

            // Check permission
            if (!habitacr_can_view_audit_log()) {
                return ['nodes' => [], 'totalCount' => 0, 'pageInfo' => ['hasNextPage' => false, 'hasPreviousPage' => false, 'total' => 0]];
            }

            $where = ['1=1'];
            $params = [];

            if (!empty($args['action'])) {
                $where[] = 'action = %s';
                $params[] = $args['action'];
            }
            if (!empty($args['entityType'])) {
                $where[] = 'entity_type = %s';
                $params[] = $args['entityType'];
            }
            if (!empty($args['entityId'])) {
                $where[] = 'entity_id = %d';
                $params[] = $args['entityId'];
            }
            if (!empty($args['userId'])) {
                $where[] = 'user_id = %d';
                $params[] = $args['userId'];
            }

            $where_sql = implode(' AND ', $where);

            $count_sql = "SELECT COUNT(*) FROM {$audit_table} WHERE {$where_sql}";
            if (!empty($params)) {
                $count_sql = $wpdb->prepare($count_sql, $params);
            }
            $total = (int) $wpdb->get_var($count_sql);

            $sql = "SELECT * FROM {$audit_table} WHERE {$where_sql} ORDER BY created_at DESC LIMIT %d OFFSET %d";
            $params[] = $args['first'];
            $params[] = $args['offset'];

            $results = $wpdb->get_results($wpdb->prepare($sql, $params));

            $logs = array_map(function($row) {
                return [
                    'id' => $row->id,
                    'action' => $row->action,
                    'entityType' => $row->entity_type,
                    'entityId' => (int) $row->entity_id,
                    'entityName' => $row->entity_name,
                    'userId' => (int) $row->user_id,
                    'userName' => $row->user_name,
                    'oldValues' => $row->old_values,
                    'newValues' => $row->new_values,
                    'ipAddress' => $row->ip_address,
                    'createdAt' => $row->created_at,
                ];
            }, $results);

            return [
                'nodes' => $logs,
                'totalCount' => $total,
                'pageInfo' => [
                    'hasNextPage' => ($args['offset'] + $args['first']) < $total,
                    'hasPreviousPage' => $args['offset'] > 0,
                    'total' => $total,
                ],
            ];
        },
    ]);

    // Get Deleted Records (Admin only) - NEW in v2.2.0
    register_graphql_field('RootQuery', 'deletedRecords', [
        'type' => 'DeletedRecordConnection',
        'description' => 'Get recoverable deleted records (admin only)',
        'args' => [
            'first' => ['type' => 'Int', 'defaultValue' => 50],
            'offset' => ['type' => 'Int', 'defaultValue' => 0],
            'entityType' => ['type' => 'String'],
        ],
        'resolve' => function($root, $args, $context, $info) use ($deleted_table) {
            global $wpdb;

            // Check permission
            if (!habitacr_can_recover_records()) {
                return ['nodes' => [], 'totalCount' => 0, 'pageInfo' => ['hasNextPage' => false, 'hasPreviousPage' => false, 'total' => 0]];
            }

            $where = ['1=1'];
            $params = [];

            if (!empty($args['entityType'])) {
                $where[] = 'entity_type = %s';
                $params[] = $args['entityType'];
            }

            $where_sql = implode(' AND ', $where);

            $count_sql = "SELECT COUNT(*) FROM {$deleted_table} WHERE {$where_sql}";
            if (!empty($params)) {
                $count_sql = $wpdb->prepare($count_sql, $params);
            }
            $total = (int) $wpdb->get_var($count_sql);

            $sql = "SELECT * FROM {$deleted_table} WHERE {$where_sql} ORDER BY deleted_at DESC LIMIT %d OFFSET %d";
            $params[] = $args['first'];
            $params[] = $args['offset'];

            $results = $wpdb->get_results($wpdb->prepare($sql, $params));

            $records = array_map(function($row) {
                $days_remaining = max(0, ceil((strtotime($row->expires_at) - time()) / 86400));
                return [
                    'id' => $row->id,
                    'entityType' => $row->entity_type,
                    'entityId' => (int) $row->entity_id,
                    'entityName' => $row->entity_name,
                    'deletedBy' => (int) $row->deleted_by,
                    'deletedByName' => $row->deleted_by_name,
                    'deletedAt' => $row->deleted_at,
                    'expiresAt' => $row->expires_at,
                    'daysRemaining' => $days_remaining,
                ];
            }, $results);

            return [
                'nodes' => $records,
                'totalCount' => $total,
                'pageInfo' => [
                    'hasNextPage' => ($args['offset'] + $args['first']) < $total,
                    'hasPreviousPage' => $args['offset'] > 0,
                    'total' => $total,
                ],
            ];
        },
    ]);

    // ============================================
    // MUTATIONS
    // ============================================

    // Create Lead
    register_graphql_mutation('createLead', [
        'inputFields' => [
            'name' => ['type' => ['non_null' => 'String']],
            'email' => ['type' => 'String'],
            'mobile' => ['type' => ['non_null' => 'String']],
            'message' => ['type' => 'String'],
            'source' => ['type' => 'String'],
            'status' => ['type' => 'String'],
            'propertyId' => ['type' => 'Int'],
            'agentId' => ['type' => 'Int'],
        ],
        'outputFields' => [
            'lead' => ['type' => 'Lead'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($leads_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['lead' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            $current_user = wp_get_current_user();
            $agent_id = !empty($input['agentId']) ? $input['agentId'] : $current_user->ID;
            $agent = get_userdata($agent_id);

            $property_title = null;
            if (!empty($input['propertyId'])) {
                $property = get_post($input['propertyId']);
                $property_title = $property ? $property->post_title : null;
            }

            $data = [
                'name' => sanitize_text_field($input['name']),
                'email' => sanitize_email($input['email'] ?? ''),
                'mobile' => sanitize_text_field($input['mobile']),
                'message' => sanitize_textarea_field($input['message'] ?? ''),
                'source' => sanitize_text_field($input['source'] ?? 'website'),
                'status' => sanitize_text_field($input['status'] ?? 'new'),
                'property_id' => $input['propertyId'] ?? null,
                'property_title' => $property_title,
                'agent_id' => $agent_id,
                'agent_name' => $agent ? $agent->display_name : '',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ];

            $result = $wpdb->insert($leads_table, $data);

            if ($result === false) {
                return ['lead' => null, 'success' => false, 'message' => 'Failed to create lead: ' . $wpdb->last_error];
            }

            $lead_id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$leads_table} WHERE id = %d", $lead_id));

            // Log to audit
            habitacr_log_audit('create', 'lead', $lead_id, $input['name'], null, $data);

            // Log activity
            log_crm_activity('lead_created', "Lead created: {$input['name']}", $lead_id, null);

            return [
                'lead' => format_lead($row),
                'success' => true,
                'message' => 'Lead created successfully',
            ];
        },
    ]);

    // Update Lead
    register_graphql_mutation('updateLead', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'name' => ['type' => 'String'],
            'email' => ['type' => 'String'],
            'mobile' => ['type' => 'String'],
            'message' => ['type' => 'String'],
            'source' => ['type' => 'String'],
            'status' => ['type' => 'String'],
            'propertyId' => ['type' => 'Int'],
            'agentId' => ['type' => 'Int'],
        ],
        'outputFields' => [
            'lead' => ['type' => 'Lead'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($leads_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['lead' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            // Get old values for audit
            $old_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$leads_table} WHERE id = %d", $input['id']));
            if (!$old_row) {
                return ['lead' => null, 'success' => false, 'message' => 'Lead not found'];
            }

            $data = ['updated_at' => current_time('mysql')];

            if (isset($input['name'])) $data['name'] = sanitize_text_field($input['name']);
            if (isset($input['email'])) $data['email'] = sanitize_email($input['email']);
            if (isset($input['mobile'])) $data['mobile'] = sanitize_text_field($input['mobile']);
            if (isset($input['message'])) $data['message'] = sanitize_textarea_field($input['message']);
            if (isset($input['source'])) $data['source'] = sanitize_text_field($input['source']);
            if (isset($input['status'])) $data['status'] = sanitize_text_field($input['status']);
            if (isset($input['propertyId'])) {
                $data['property_id'] = $input['propertyId'];
                $property = get_post($input['propertyId']);
                $data['property_title'] = $property ? $property->post_title : null;
            }
            if (isset($input['agentId'])) {
                $data['agent_id'] = $input['agentId'];
                $agent = get_userdata($input['agentId']);
                $data['agent_name'] = $agent ? $agent->display_name : '';
            }

            $result = $wpdb->update($leads_table, $data, ['id' => $input['id']]);

            if ($result === false) {
                return ['lead' => null, 'success' => false, 'message' => 'Failed to update lead'];
            }

            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$leads_table} WHERE id = %d", $input['id']));

            // Log to audit
            habitacr_log_audit('update', 'lead', $input['id'], $row->name, (array)$old_row, $data);

            return [
                'lead' => format_lead($row),
                'success' => true,
                'message' => 'Lead updated successfully',
            ];
        },
    ]);

    // Delete Lead (Soft delete with recovery) - UPDATED in v2.2.0
    register_graphql_mutation('deleteLead', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'hardDelete' => ['type' => 'Boolean', 'defaultValue' => false],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($leads_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['success' => false, 'message' => 'Not authenticated'];
            }

            if (!habitacr_can_delete_records()) {
                return ['success' => false, 'message' => 'Permission denied'];
            }

            // Get lead for name
            $lead = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$leads_table} WHERE id = %d", $input['id']));
            if (!$lead) {
                return ['success' => false, 'message' => 'Lead not found'];
            }

            // Hard delete (admin only)
            if (!empty($input['hardDelete'])) {
                if (!habitacr_can_hard_delete()) {
                    return ['success' => false, 'message' => 'Hard delete requires admin privileges'];
                }
                $result = $wpdb->delete($leads_table, ['id' => $input['id']]);
                habitacr_log_audit('hard_delete', 'lead', $input['id'], $lead->name, (array)$lead, null);
                return [
                    'success' => $result !== false,
                    'message' => $result !== false ? 'Lead permanently deleted' : 'Failed to delete lead',
                ];
            }

            // Soft delete
            $result = habitacr_soft_delete_record($leads_table, $input['id'], 'lead', $lead->name);

            return [
                'success' => $result,
                'message' => $result ? 'Lead moved to trash (recoverable for 30 days)' : 'Failed to delete lead',
            ];
        },
    ]);

    // Create Deal
    register_graphql_mutation('createDeal', [
        'inputFields' => [
            'leadId' => ['type' => 'Int'],
            'leadName' => ['type' => ['non_null' => 'String']],
            'leadEmail' => ['type' => 'String'],
            'leadMobile' => ['type' => ['non_null' => 'String']],
            'group' => ['type' => 'String'],
            'busca' => ['type' => 'String'],
            'estado' => ['type' => 'String'],
            'calificacion' => ['type' => 'String'],
            'proximoPaso' => ['type' => 'String'],
            'propiedad' => ['type' => 'String'],
            'detalles' => ['type' => 'String'],
            'agentId' => ['type' => 'Int'],
        ],
        'outputFields' => [
            'deal' => ['type' => 'Deal'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($deals_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['deal' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            $current_user = wp_get_current_user();
            $agent_id = !empty($input['agentId']) ? $input['agentId'] : $current_user->ID;
            $agent = get_userdata($agent_id);

            $data = [
                'lead_id' => $input['leadId'] ?? null,
                'lead_name' => sanitize_text_field($input['leadName']),
                'lead_email' => sanitize_email($input['leadEmail'] ?? ''),
                'lead_mobile' => sanitize_text_field($input['leadMobile']),
                'group' => sanitize_text_field($input['group'] ?? 'active'),
                'busca' => sanitize_text_field($input['busca'] ?? ''),
                'estado' => sanitize_text_field($input['estado'] ?? 'nuevo'),
                'calificacion' => sanitize_text_field($input['calificacion'] ?? ''),
                'proximo_paso' => sanitize_text_field($input['proximoPaso'] ?? ''),
                'propiedad' => sanitize_text_field($input['propiedad'] ?? ''),
                'detalles' => sanitize_textarea_field($input['detalles'] ?? ''),
                'agent_id' => $agent_id,
                'agent_name' => $agent ? $agent->display_name : '',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ];

            $result = $wpdb->insert($deals_table, $data);

            if ($result === false) {
                return ['deal' => null, 'success' => false, 'message' => 'Failed to create deal: ' . $wpdb->last_error];
            }

            $deal_id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$deals_table} WHERE id = %d", $deal_id));

            // Log to audit
            habitacr_log_audit('create', 'deal', $deal_id, $input['leadName'], null, $data);
            log_crm_activity('deal_created', "Deal created for: {$input['leadName']}", null, $deal_id);

            return [
                'deal' => format_deal($row),
                'success' => true,
                'message' => 'Deal created successfully',
            ];
        },
    ]);

    // Update Deal
    register_graphql_mutation('updateDeal', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'group' => ['type' => 'String'],
            'busca' => ['type' => 'String'],
            'estado' => ['type' => 'String'],
            'calificacion' => ['type' => 'String'],
            'proximoPaso' => ['type' => 'String'],
            'propiedad' => ['type' => 'String'],
            'detalles' => ['type' => 'String'],
            'fecha1' => ['type' => 'String'],
            'fecha2' => ['type' => 'String'],
            'visitaConfirmada' => ['type' => 'Boolean'],
            'agentId' => ['type' => 'Int'],
        ],
        'outputFields' => [
            'deal' => ['type' => 'Deal'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($deals_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['deal' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            // Get old values for audit
            $old_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$deals_table} WHERE id = %d", $input['id']));
            if (!$old_row) {
                return ['deal' => null, 'success' => false, 'message' => 'Deal not found'];
            }

            $data = ['updated_at' => current_time('mysql')];

            if (isset($input['group'])) $data['group'] = sanitize_text_field($input['group']);
            if (isset($input['busca'])) $data['busca'] = sanitize_text_field($input['busca']);
            if (isset($input['estado'])) $data['estado'] = sanitize_text_field($input['estado']);
            if (isset($input['calificacion'])) $data['calificacion'] = sanitize_text_field($input['calificacion']);
            if (isset($input['proximoPaso'])) $data['proximo_paso'] = sanitize_text_field($input['proximoPaso']);
            if (isset($input['propiedad'])) $data['propiedad'] = sanitize_text_field($input['propiedad']);
            if (isset($input['detalles'])) $data['detalles'] = sanitize_textarea_field($input['detalles']);
            if (isset($input['fecha1'])) $data['fecha1'] = sanitize_text_field($input['fecha1']);
            if (isset($input['fecha2'])) $data['fecha2'] = sanitize_text_field($input['fecha2']);
            if (isset($input['visitaConfirmada'])) $data['visita_confirmada'] = $input['visitaConfirmada'] ? 1 : 0;
            if (isset($input['agentId'])) {
                $data['agent_id'] = $input['agentId'];
                $agent = get_userdata($input['agentId']);
                $data['agent_name'] = $agent ? $agent->display_name : '';
            }

            $result = $wpdb->update($deals_table, $data, ['id' => $input['id']]);

            if ($result === false) {
                return ['deal' => null, 'success' => false, 'message' => 'Failed to update deal'];
            }

            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$deals_table} WHERE id = %d", $input['id']));

            // Log to audit
            habitacr_log_audit('update', 'deal', $input['id'], $row->lead_name, (array)$old_row, $data);

            return [
                'deal' => format_deal($row),
                'success' => true,
                'message' => 'Deal updated successfully',
            ];
        },
    ]);

    // Delete Deal (Soft delete with recovery) - UPDATED in v2.2.0
    register_graphql_mutation('deleteDeal', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
            'hardDelete' => ['type' => 'Boolean', 'defaultValue' => false],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($deals_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['success' => false, 'message' => 'Not authenticated'];
            }

            if (!habitacr_can_delete_records()) {
                return ['success' => false, 'message' => 'Permission denied'];
            }

            // Get deal for name
            $deal = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$deals_table} WHERE id = %d", $input['id']));
            if (!$deal) {
                return ['success' => false, 'message' => 'Deal not found'];
            }

            // Hard delete (admin only)
            if (!empty($input['hardDelete'])) {
                if (!habitacr_can_hard_delete()) {
                    return ['success' => false, 'message' => 'Hard delete requires admin privileges'];
                }
                $result = $wpdb->delete($deals_table, ['id' => $input['id']]);
                habitacr_log_audit('hard_delete', 'deal', $input['id'], $deal->lead_name, (array)$deal, null);
                return [
                    'success' => $result !== false,
                    'message' => $result !== false ? 'Deal permanently deleted' : 'Failed to delete deal',
                ];
            }

            // Soft delete
            $result = habitacr_soft_delete_record($deals_table, $input['id'], 'deal', $deal->lead_name);

            return [
                'success' => $result,
                'message' => $result ? 'Deal moved to trash (recoverable for 30 days)' : 'Failed to delete deal',
            ];
        },
    ]);

    // Recover Record - NEW in v2.2.0
    register_graphql_mutation('recoverRecord', [
        'inputFields' => [
            'entityType' => ['type' => ['non_null' => 'String']],
            'entityId' => ['type' => ['non_null' => 'Int']],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) {
            if (!is_user_logged_in()) {
                return ['success' => false, 'message' => 'Not authenticated'];
            }

            if (!habitacr_can_recover_records()) {
                return ['success' => false, 'message' => 'Permission denied - admin only'];
            }

            $result = habitacr_recover_record($input['entityType'], $input['entityId']);

            return $result;
        },
    ]);

    // Bulk Delete - NEW in v2.2.0
    register_graphql_mutation('bulkDelete', [
        'inputFields' => [
            'entityType' => ['type' => ['non_null' => 'String']],
            'ids' => ['type' => ['non_null' => ['list_of' => 'ID']]],
            'hardDelete' => ['type' => 'Boolean', 'defaultValue' => false],
        ],
        'outputFields' => [
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
            'deletedCount' => ['type' => 'Int'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['success' => false, 'message' => 'Not authenticated', 'deletedCount' => 0];
            }

            if (!habitacr_can_delete_records()) {
                return ['success' => false, 'message' => 'Permission denied', 'deletedCount' => 0];
            }

            $table = '';
            if ($input['entityType'] === 'lead') {
                $table = $wpdb->prefix . 'developer_starter_leads';
            } elseif ($input['entityType'] === 'deal') {
                $table = $wpdb->prefix . 'developer_starter_deals';
            } else {
                return ['success' => false, 'message' => 'Invalid entity type', 'deletedCount' => 0];
            }

            $deleted = 0;
            foreach ($input['ids'] as $id) {
                if (!empty($input['hardDelete']) && habitacr_can_hard_delete()) {
                    $result = $wpdb->delete($table, ['id' => $id]);
                    if ($result) {
                        habitacr_log_audit('hard_delete', $input['entityType'], $id, '');
                        $deleted++;
                    }
                } else {
                    $record = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id));
                    if ($record) {
                        $name = $record->name ?? $record->lead_name ?? '';
                        if (habitacr_soft_delete_record($table, $id, $input['entityType'], $name)) {
                            $deleted++;
                        }
                    }
                }
            }

            return [
                'success' => $deleted > 0,
                'message' => "{$deleted} records deleted",
                'deletedCount' => $deleted,
            ];
        },
    ]);

    // Create Note
    register_graphql_mutation('createNote', [
        'inputFields' => [
            'content' => ['type' => ['non_null' => 'String']],
            'leadId' => ['type' => 'Int'],
            'dealId' => ['type' => 'Int'],
        ],
        'outputFields' => [
            'note' => ['type' => 'Note'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($notes_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['note' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            $current_user = wp_get_current_user();

            $data = [
                'content' => sanitize_textarea_field($input['content']),
                'lead_id' => $input['leadId'] ?? null,
                'deal_id' => $input['dealId'] ?? null,
                'author_id' => $current_user->ID,
                'author_name' => $current_user->display_name,
                'created_at' => current_time('mysql'),
            ];

            $result = $wpdb->insert($notes_table, $data);

            if ($result === false) {
                return ['note' => null, 'success' => false, 'message' => 'Failed to create note'];
            }

            $note_id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$notes_table} WHERE id = %d", $note_id));

            return [
                'note' => format_note($row),
                'success' => true,
                'message' => 'Note created successfully',
            ];
        },
    ]);

    // Create Enquiry
    register_graphql_mutation('createEnquiry', [
        'inputFields' => [
            'leadId' => ['type' => ['non_null' => 'Int']],
            'tipo' => ['type' => 'String'],
            'presupuestoMin' => ['type' => 'Float'],
            'presupuestoMax' => ['type' => 'Float'],
            'ubicaciones' => ['type' => 'String'],
            'habitaciones' => ['type' => 'Int'],
            'banos' => ['type' => 'Int'],
            'amenidades' => ['type' => 'String'],
            'notas' => ['type' => 'String'],
        ],
        'outputFields' => [
            'enquiry' => ['type' => 'Enquiry'],
            'success' => ['type' => 'Boolean'],
            'message' => ['type' => 'String'],
        ],
        'mutateAndGetPayload' => function($input, $context, $info) use ($enquiries_table, $leads_table) {
            global $wpdb;

            if (!is_user_logged_in()) {
                return ['enquiry' => null, 'success' => false, 'message' => 'Not authenticated'];
            }

            // Get lead name
            $lead = $wpdb->get_row($wpdb->prepare("SELECT name FROM {$leads_table} WHERE id = %d", $input['leadId']));

            $data = [
                'lead_id' => $input['leadId'],
                'lead_name' => $lead ? $lead->name : '',
                'tipo' => sanitize_text_field($input['tipo'] ?? ''),
                'presupuesto_min' => $input['presupuestoMin'] ?? null,
                'presupuesto_max' => $input['presupuestoMax'] ?? null,
                'ubicaciones' => sanitize_text_field($input['ubicaciones'] ?? ''),
                'habitaciones' => $input['habitaciones'] ?? null,
                'banos' => $input['banos'] ?? null,
                'amenidades' => sanitize_text_field($input['amenidades'] ?? ''),
                'notas' => sanitize_textarea_field($input['notas'] ?? ''),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ];

            $result = $wpdb->insert($enquiries_table, $data);

            if ($result === false) {
                return ['enquiry' => null, 'success' => false, 'message' => 'Failed to create enquiry'];
            }

            $enquiry_id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$enquiries_table} WHERE id = %d", $enquiry_id));

            return [
                'enquiry' => format_enquiry($row),
                'success' => true,
                'message' => 'Enquiry created successfully',
            ];
        },
    ]);
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function format_lead($row) {
    global $wpdb;
    $notes_table = $wpdb->prefix . 'developer_starter_notes';
    $activities_table = $wpdb->prefix . 'developer_starter_activities';

    $notes = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$notes_table} WHERE lead_id = %d ORDER BY created_at DESC",
        $row->id
    ));

    $activities = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$activities_table} WHERE lead_id = %d ORDER BY created_at DESC",
        $row->id
    ));

    return [
        'id' => $row->id,
        'name' => $row->name,
        'email' => $row->email,
        'mobile' => $row->mobile,
        'message' => $row->message,
        'source' => $row->source,
        'status' => $row->status,
        'propertyId' => $row->property_id,
        'propertyTitle' => $row->property_title,
        'agentId' => $row->agent_id,
        'agentName' => $row->agent_name,
        'createdAt' => $row->created_at,
        'updatedAt' => $row->updated_at,
        'deletedAt' => $row->deleted_at ?? null,
        'notes' => array_map('format_note', $notes),
        'activities' => array_map('format_activity', $activities),
    ];
}

function format_deal($row) {
    global $wpdb;
    $notes_table = $wpdb->prefix . 'developer_starter_notes';
    $activities_table = $wpdb->prefix . 'developer_starter_activities';

    $notes = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$notes_table} WHERE deal_id = %d ORDER BY created_at DESC",
        $row->id
    ));

    $activities = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$activities_table} WHERE deal_id = %d ORDER BY created_at DESC",
        $row->id
    ));

    return [
        'id' => $row->id,
        'leadId' => $row->lead_id,
        'leadName' => $row->lead_name,
        'leadEmail' => $row->lead_email,
        'leadMobile' => $row->lead_mobile,
        'group' => $row->group,
        'busca' => $row->busca,
        'estado' => $row->estado,
        'calificacion' => $row->calificacion,
        'proximoPaso' => $row->proximo_paso,
        'propiedad' => $row->propiedad,
        'detalles' => $row->detalles,
        'fecha1' => $row->fecha1,
        'fecha2' => $row->fecha2,
        'visitaConfirmada' => (bool) $row->visita_confirmada,
        'agentId' => $row->agent_id,
        'agentName' => $row->agent_name,
        'createdAt' => $row->created_at,
        'updatedAt' => $row->updated_at,
        'deletedAt' => $row->deleted_at ?? null,
        'notes' => array_map('format_note', $notes),
        'activities' => array_map('format_activity', $activities),
    ];
}

function format_enquiry($row) {
    return [
        'id' => $row->id,
        'leadId' => $row->lead_id,
        'leadName' => $row->lead_name,
        'tipo' => $row->tipo,
        'presupuestoMin' => (float) $row->presupuesto_min,
        'presupuestoMax' => (float) $row->presupuesto_max,
        'ubicaciones' => $row->ubicaciones,
        'habitaciones' => (int) $row->habitaciones,
        'banos' => (int) $row->banos,
        'amenidades' => $row->amenidades,
        'notas' => $row->notas,
        'createdAt' => $row->created_at,
        'updatedAt' => $row->updated_at,
    ];
}

function format_note($row) {
    return [
        'id' => $row->id,
        'content' => $row->content,
        'leadId' => $row->lead_id,
        'dealId' => $row->deal_id,
        'authorId' => $row->author_id,
        'authorName' => $row->author_name,
        'createdAt' => $row->created_at,
    ];
}

function format_activity($row) {
    return [
        'id' => $row->id,
        'type' => $row->type,
        'description' => $row->description,
        'leadId' => $row->lead_id,
        'dealId' => $row->deal_id,
        'userId' => $row->user_id,
        'userName' => $row->user_name,
        'createdAt' => $row->created_at,
    ];
}

function log_crm_activity($type, $description, $lead_id = null, $deal_id = null) {
    global $wpdb;
    $activities_table = $wpdb->prefix . 'developer_starter_activities';

    $current_user = wp_get_current_user();

    $wpdb->insert($activities_table, [
        'type' => $type,
        'description' => $description,
        'lead_id' => $lead_id,
        'deal_id' => $deal_id,
        'user_id' => $current_user->ID,
        'user_name' => $current_user->display_name,
        'created_at' => current_time('mysql'),
    ]);
}

// ============================================
// DATABASE TABLES CREATION (Original v1.0 tables)
// ============================================

register_activation_hook(__FILE__, 'habitacr_graphql_activate');

function habitacr_graphql_activate() {
    habitacr_graphql_create_tables();
    habitacr_create_v2_tables();
    habitacr_add_soft_delete_columns();
    habitacr_setup_crm_roles();
    habitacr_schedule_cleanup();
    update_option('habitacr_crm_db_version', HABITACR_CRM_DB_VERSION);
}

function habitacr_graphql_create_tables() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    $leads_table = $wpdb->prefix . 'developer_starter_leads';
    $deals_table = $wpdb->prefix . 'developer_starter_deals';
    $enquiries_table = $wpdb->prefix . 'developer_starter_enquiries';
    $notes_table = $wpdb->prefix . 'developer_starter_notes';
    $activities_table = $wpdb->prefix . 'developer_starter_activities';

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Leads table
    $sql_leads = "CREATE TABLE IF NOT EXISTS {$leads_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        email varchar(255),
        mobile varchar(50) NOT NULL,
        message text,
        source varchar(50) DEFAULT 'website',
        status varchar(50) DEFAULT 'new',
        property_id bigint(20),
        property_title varchar(255),
        agent_id bigint(20),
        agent_name varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at datetime DEFAULT NULL,
        PRIMARY KEY (id),
        KEY status (status),
        KEY source (source),
        KEY agent_id (agent_id),
        KEY deleted_at (deleted_at)
    ) {$charset_collate};";
    dbDelta($sql_leads);

    // Deals table
    $sql_deals = "CREATE TABLE IF NOT EXISTS {$deals_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        lead_id bigint(20),
        lead_name varchar(255) NOT NULL,
        lead_email varchar(255),
        lead_mobile varchar(50) NOT NULL,
        `group` varchar(50) DEFAULT 'active',
        busca varchar(100),
        estado varchar(50) DEFAULT 'nuevo',
        calificacion varchar(50),
        proximo_paso varchar(100),
        propiedad varchar(255),
        detalles text,
        fecha1 date,
        fecha2 date,
        visita_confirmada tinyint(1) DEFAULT 0,
        agent_id bigint(20),
        agent_name varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at datetime DEFAULT NULL,
        PRIMARY KEY (id),
        KEY `group` (`group`),
        KEY estado (estado),
        KEY agent_id (agent_id),
        KEY lead_id (lead_id),
        KEY deleted_at (deleted_at)
    ) {$charset_collate};";
    dbDelta($sql_deals);

    // Enquiries table
    $sql_enquiries = "CREATE TABLE IF NOT EXISTS {$enquiries_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        lead_id bigint(20) NOT NULL,
        lead_name varchar(255),
        tipo varchar(100),
        presupuesto_min decimal(15,2),
        presupuesto_max decimal(15,2),
        ubicaciones text,
        habitaciones int,
        banos int,
        amenidades text,
        notas text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY lead_id (lead_id)
    ) {$charset_collate};";
    dbDelta($sql_enquiries);

    // Notes table
    $sql_notes = "CREATE TABLE IF NOT EXISTS {$notes_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        content text NOT NULL,
        lead_id bigint(20),
        deal_id bigint(20),
        author_id bigint(20) NOT NULL,
        author_name varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY lead_id (lead_id),
        KEY deal_id (deal_id)
    ) {$charset_collate};";
    dbDelta($sql_notes);

    // Activities table
    $sql_activities = "CREATE TABLE IF NOT EXISTS {$activities_table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        type varchar(100) NOT NULL,
        description text,
        lead_id bigint(20),
        deal_id bigint(20),
        user_id bigint(20),
        user_name varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY lead_id (lead_id),
        KEY deal_id (deal_id),
        KEY type (type)
    ) {$charset_collate};";
    dbDelta($sql_activities);
}
