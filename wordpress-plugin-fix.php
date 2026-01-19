<?php
/**
 * FIXES para habitacr-graphql.php
 *
 * Reemplaza la sección de registro de campos 'deals' con este código:
 */

// =============================================
// FIX 1: Deals query con filtro stage que funciona
// =============================================

// Busca donde se registra el campo 'deals' y reemplázalo con:

register_graphql_field('RootQuery', 'deals', [
    'type' => 'DealConnection',
    'description' => 'Get all deals',
    'args' => [
        'first' => ['type' => 'Int', 'defaultValue' => 20],
        'offset' => ['type' => 'Int', 'defaultValue' => 0],
        'stage' => ['type' => 'String'],  // IMPORTANTE: filtro por stage
        'search' => ['type' => 'String'],
    ],
    'resolve' => function($root, $args) {
        global $wpdb;
        $table = $wpdb->prefix . 'crm_deals';

        $where = ['1=1'];
        $params = [];

        // FILTRO POR STAGE - ESTO ES LO QUE FALTABA
        if (!empty($args['stage'])) {
            $where[] = 'stage = %s';
            $params[] = $args['stage'];
        }

        if (!empty($args['search'])) {
            $where[] = 'title LIKE %s';
            $params[] = '%' . $wpdb->esc_like($args['search']) . '%';
        }

        $where_sql = implode(' AND ', $where);

        // Count total
        $count_sql = "SELECT COUNT(*) FROM $table WHERE $where_sql";
        if (!empty($params)) {
            $count_sql = $wpdb->prepare($count_sql, $params);
        }
        $total = (int) $wpdb->get_var($count_sql);

        // Get deals
        $limit = (int) $args['first'];
        $offset = (int) $args['offset'];

        $sql = "SELECT * FROM $table WHERE $where_sql ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $all_params = array_merge($params, [$limit, $offset]);
        $sql = $wpdb->prepare($sql, $all_params);

        $results = $wpdb->get_results($sql);

        $nodes = array_map(function($row) {
            return [
                'id' => $row->id,
                'title' => $row->title,
                'leadId' => (int) $row->lead_id,
                'stage' => $row->stage,
                'value' => $row->value ? (float) $row->value : null,
                'createdAt' => $row->created_at,
            ];
        }, $results ?: []);

        return [
            'nodes' => $nodes,
            'totalCount' => $total,
        ];
    }
]);

// =============================================
// FIX 2: Delete Deal mutation que funciona
// =============================================

register_graphql_mutation('deleteDeal', [
    'inputFields' => [
        'id' => ['type' => ['non_null' => 'ID']],
    ],
    'outputFields' => [
        'success' => ['type' => 'Boolean'],
        'clientMutationId' => ['type' => 'String'],
    ],
    'mutateAndGetPayload' => function($input) {
        global $wpdb;
        $table = $wpdb->prefix . 'crm_deals';

        $id = absint($input['id']);

        if (!$id) {
            return [
                'success' => false,
                'clientMutationId' => $input['clientMutationId'] ?? null,
            ];
        }

        $deleted = $wpdb->delete($table, ['id' => $id], ['%d']);

        return [
            'success' => $deleted !== false,
            'clientMutationId' => $input['clientMutationId'] ?? null,
        ];
    }
]);

// =============================================
// FIX 3: Update Deal mutation con stage
// =============================================

register_graphql_mutation('updateDeal', [
    'inputFields' => [
        'id' => ['type' => ['non_null' => 'ID']],
        'title' => ['type' => 'String'],
        'stage' => ['type' => 'String'],
        'value' => ['type' => 'Float'],
    ],
    'outputFields' => [
        'deal' => ['type' => 'Deal'],
        'success' => ['type' => 'Boolean'],
        'clientMutationId' => ['type' => 'String'],
    ],
    'mutateAndGetPayload' => function($input) {
        global $wpdb;
        $table = $wpdb->prefix . 'crm_deals';

        $id = absint($input['id']);

        $data = [];
        $formats = [];

        if (isset($input['title'])) {
            $data['title'] = sanitize_text_field($input['title']);
            $formats[] = '%s';
        }
        if (isset($input['stage'])) {
            $data['stage'] = sanitize_text_field($input['stage']);
            $formats[] = '%s';
        }
        if (isset($input['value'])) {
            $data['value'] = floatval($input['value']);
            $formats[] = '%f';
        }

        if (empty($data)) {
            return [
                'deal' => null,
                'success' => false,
                'clientMutationId' => $input['clientMutationId'] ?? null,
            ];
        }

        $updated = $wpdb->update($table, $data, ['id' => $id], $formats, ['%d']);

        // Get updated deal
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));

        $deal = $row ? [
            'id' => $row->id,
            'title' => $row->title,
            'leadId' => (int) $row->lead_id,
            'stage' => $row->stage,
            'value' => $row->value ? (float) $row->value : null,
            'createdAt' => $row->created_at,
        ] : null;

        return [
            'deal' => $deal,
            'success' => $updated !== false,
            'clientMutationId' => $input['clientMutationId'] ?? null,
        ];
    }
]);

// =============================================
// FIX 4: Create Deal mutation
// =============================================

register_graphql_mutation('createDeal', [
    'inputFields' => [
        'title' => ['type' => ['non_null' => 'String']],
        'leadId' => ['type' => ['non_null' => 'Int']],
        'stage' => ['type' => 'String', 'defaultValue' => 'active'],
        'value' => ['type' => 'Float'],
    ],
    'outputFields' => [
        'deal' => ['type' => 'Deal'],
        'success' => ['type' => 'Boolean'],
        'clientMutationId' => ['type' => 'String'],
    ],
    'mutateAndGetPayload' => function($input) {
        global $wpdb;
        $table = $wpdb->prefix . 'crm_deals';

        $data = [
            'title' => sanitize_text_field($input['title']),
            'lead_id' => absint($input['leadId']),
            'stage' => sanitize_text_field($input['stage'] ?? 'active'),
            'value' => isset($input['value']) ? floatval($input['value']) : null,
            'created_at' => current_time('mysql'),
        ];

        $inserted = $wpdb->insert($table, $data, ['%s', '%d', '%s', '%f', '%s']);

        if ($inserted) {
            $id = $wpdb->insert_id;
            $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));

            $deal = [
                'id' => $row->id,
                'title' => $row->title,
                'leadId' => (int) $row->lead_id,
                'stage' => $row->stage,
                'value' => $row->value ? (float) $row->value : null,
                'createdAt' => $row->created_at,
            ];

            return [
                'deal' => $deal,
                'success' => true,
                'clientMutationId' => $input['clientMutationId'] ?? null,
            ];
        }

        return [
            'deal' => null,
            'success' => false,
            'clientMutationId' => $input['clientMutationId'] ?? null,
        ];
    }
]);
