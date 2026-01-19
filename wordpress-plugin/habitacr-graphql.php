<?php
/**
 * Plugin Name: HabitaCR GraphQL Extension
 * Description: Extends WPGraphQL to expose Houzez CRM data (Leads, Deals, Enquiries, Notes, Activities)
 * Version: 1.0.0
 * Author: HabitaCR
 * Requires Plugins: wp-graphql
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check if WPGraphQL is active
add_action('plugins_loaded', function() {
    if (!class_exists('WPGraphQL')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p>HabitaCR GraphQL Extension requires WPGraphQL plugin to be installed and active.</p></div>';
        });
        return;
    }
});

// Register GraphQL Types and Fields
add_action('graphql_register_types', function() {
    global $wpdb;

    $leads_table = $wpdb->prefix . 'developer_starter_leads';
    $deals_table = $wpdb->prefix . 'developer_starter_deals';
    $enquiries_table = $wpdb->prefix . 'developer_starter_enquiries';
    $notes_table = $wpdb->prefix . 'developer_starter_notes';
    $activities_table = $wpdb->prefix . 'developer_starter_activities';

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

    // Get all leads
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
        ],
        'resolve' => function($root, $args, $context, $info) use ($leads_table) {
            global $wpdb;

            $where = ['1=1'];
            $params = [];

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
                "SELECT * FROM {$leads_table} WHERE id = %d",
                $args['id']
            ));
            return $row ? format_lead($row) : null;
        },
    ]);

    // Get all deals
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
        ],
        'resolve' => function($root, $args, $context, $info) use ($deals_table) {
            global $wpdb;

            $where = ['1=1'];
            $params = [];

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
                "SELECT * FROM {$deals_table} WHERE id = %d",
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

    // Get CRM Stats
    register_graphql_field('RootQuery', 'crmStats', [
        'type' => 'CRMStats',
        'description' => 'Get CRM statistics',
        'resolve' => function($root, $args, $context, $info) use ($leads_table, $deals_table) {
            global $wpdb;

            $totalLeads = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$leads_table}");
            $totalDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table}");
            $activeDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table} WHERE `group` = 'active'");
            $wonDeals = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$deals_table} WHERE `group` = 'won'");

            $firstOfMonth = date('Y-m-01 00:00:00');
            $newLeadsThisMonth = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$leads_table} WHERE created_at >= %s",
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

            // Check authentication
            if (!is_user_logged_in()) {
                return [
                    'lead' => null,
                    'success' => false,
                    'message' => 'Not authenticated',
                ];
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
                return [
                    'lead' => null,
                    'success' => false,
                    'message' => 'Failed to create lead: ' . $wpdb->last_error,
                ];
            }

            $lead_id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$leads_table} WHERE id = %d", $lead_id));

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

            return [
                'lead' => format_lead($row),
                'success' => true,
                'message' => 'Lead updated successfully',
            ];
        },
    ]);

    // Delete Lead
    register_graphql_mutation('deleteLead', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
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

            $result = $wpdb->delete($leads_table, ['id' => $input['id']]);

            return [
                'success' => $result !== false,
                'message' => $result !== false ? 'Lead deleted successfully' : 'Failed to delete lead',
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
                'estado' => sanitize_text_field($input['estado'] ?? 'initial_contact'),
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

            return [
                'deal' => format_deal($row),
                'success' => true,
                'message' => 'Deal updated successfully',
            ];
        },
    ]);

    // Delete Deal
    register_graphql_mutation('deleteDeal', [
        'inputFields' => [
            'id' => ['type' => ['non_null' => 'ID']],
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

            $result = $wpdb->delete($deals_table, ['id' => $input['id']]);

            return [
                'success' => $result !== false,
                'message' => $result !== false ? 'Deal deleted successfully' : 'Failed to delete deal',
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
// DATABASE TABLES CREATION
// ============================================

register_activation_hook(__FILE__, 'habitacr_graphql_create_tables');

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
        PRIMARY KEY (id),
        KEY status (status),
        KEY source (source),
        KEY agent_id (agent_id)
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
        estado varchar(50) DEFAULT 'initial_contact',
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
        PRIMARY KEY (id),
        KEY `group` (`group`),
        KEY estado (estado),
        KEY agent_id (agent_id),
        KEY lead_id (lead_id)
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
