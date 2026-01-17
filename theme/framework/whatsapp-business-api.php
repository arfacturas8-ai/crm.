<?php
/**
 * WhatsApp Business API Integration for HabitaCR
 * Supports multiple providers with 1000 free messages/month
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class HabitaCR_WhatsApp_Business_API {
    
    // API Configuration - You can change provider here
    private $provider = 'meta'; // Options: 'meta', 'twilio', '360dialog', 'messagebird'
    private $api_credentials = array();
    
    public function __construct() {
        // Load API credentials from database
        $this->load_credentials();
        
        // Add admin menu for configuration
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Register REST API endpoints
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        
        // Schedule cron for daily reminders
        add_action('init', array($this, 'schedule_daily_reminders'));
        add_action('habitacr_daily_whatsapp_reminders', array($this, 'send_daily_reminders'));
    }
    
    /**
     * Load API credentials from database
     */
    private function load_credentials() {
        $this->api_credentials = get_option('habitacr_whatsapp_api', array(
            'provider' => 'meta',
            'account_sid' => '',
            'auth_token' => '',
            'from_number' => '',
            'api_key' => '',
            'webhook_url' => '',
            'meta_access_token' => '',
            'meta_phone_id' => '',
            'meta_business_id' => ''
        ));
    }
    
    /**
     * Add admin menu for API configuration
     */
    public function add_admin_menu() {
        add_submenu_page(
            'houzez_dashboard',
            'WhatsApp Business API',
            'WhatsApp API',
            'manage_options',
            'habitacr-whatsapp-api',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Admin configuration page
     */
    public function admin_page() {
        // Save settings if form submitted
        if (isset($_POST['save_api_settings']) && wp_verify_nonce($_POST['api_nonce'], 'save_whatsapp_api')) {
            $settings = array(
                'provider' => sanitize_text_field($_POST['provider']),
                'account_sid' => sanitize_text_field($_POST['account_sid']),
                'auth_token' => sanitize_text_field($_POST['auth_token']),
                'from_number' => sanitize_text_field($_POST['from_number']),
                'api_key' => sanitize_text_field($_POST['api_key']),
                'webhook_url' => esc_url_raw($_POST['webhook_url']),
                'meta_access_token' => sanitize_text_field($_POST['meta_access_token']),
                'meta_phone_id' => sanitize_text_field($_POST['meta_phone_id']),
                'meta_business_id' => sanitize_text_field($_POST['meta_business_id'])
            );
            update_option('habitacr_whatsapp_api', $settings);
            $this->load_credentials();
            echo '<div class="notice notice-success"><p>¡Configuración guardada!</p></div>';
        }
        
        $creds = $this->api_credentials;
        ?>
        <div class="wrap">
            <h1>WhatsApp Business API Configuration</h1>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>Configuración API</h2>
                <form method="post">
                    <?php wp_nonce_field('save_whatsapp_api', 'api_nonce'); ?>
                    
                    <table class="form-table">
                        <tr>
                            <th>Proveedor</th>
                            <td>
                                <select name="provider" id="provider">
                                    <option value="meta" <?php selected($creds['provider'], 'meta'); ?>>Meta Cloud API (1000 msg gratis/mes)</option>
                                    <option value="twilio" <?php selected($creds['provider'], 'twilio'); ?>>Twilio</option>
                                    <option value="360dialog" <?php selected($creds['provider'], '360dialog'); ?>>360dialog</option>
                                    <option value="messagebird" <?php selected($creds['provider'], 'messagebird'); ?>>MessageBird</option>
                                </select>
                                <p class="description">Meta Cloud API ofrece 1000 mensajes gratis al mes sin costo</p>
                            </td>
                        </tr>
                        
                        <!-- Twilio Settings -->
                        <tr class="twilio-settings">
                            <th>Account SID</th>
                            <td>
                                <input type="text" name="account_sid" value="<?php echo esc_attr($creds['account_sid']); ?>" class="regular-text" />
                                <p class="description">Encuentra esto en tu <a href="https://console.twilio.com" target="_blank">Twilio Console</a></p>
                            </td>
                        </tr>
                        <tr class="twilio-settings">
                            <th>Auth Token</th>
                            <td>
                                <input type="password" name="auth_token" value="<?php echo esc_attr($creds['auth_token']); ?>" class="regular-text" />
                            </td>
                        </tr>
                        <tr class="twilio-settings">
                            <th>Número WhatsApp</th>
                            <td>
                                <input type="text" name="from_number" value="<?php echo esc_attr($creds['from_number']); ?>" class="regular-text" />
                                <p class="description">Formato: +14155238886 (número de Twilio)</p>
                            </td>
                        </tr>
                        
                        <!-- Meta Cloud API Settings -->
                        <tr class="meta-settings" style="display:none;">
                            <th>Access Token</th>
                            <td>
                                <input type="text" name="meta_access_token" value="<?php echo esc_attr($creds['meta_access_token']); ?>" class="regular-text" />
                                <p class="description">Tu token de acceso de Meta for Developers</p>
                            </td>
                        </tr>
                        <tr class="meta-settings" style="display:none;">
                            <th>Phone Number ID</th>
                            <td>
                                <input type="text" name="meta_phone_id" value="<?php echo esc_attr($creds['meta_phone_id']); ?>" class="regular-text" />
                                <p class="description">ID del número de teléfono de WhatsApp Business</p>
                            </td>
                        </tr>
                        <tr class="meta-settings" style="display:none;">
                            <th>Business Account ID</th>
                            <td>
                                <input type="text" name="meta_business_id" value="<?php echo esc_attr($creds['meta_business_id']); ?>" class="regular-text" />
                                <p class="description">ID de tu cuenta de WhatsApp Business (opcional)</p>
                            </td>
                        </tr>
                        
                        <!-- Other providers -->
                        <tr class="other-settings" style="display:none;">
                            <th>API Key</th>
                            <td>
                                <input type="text" name="api_key" value="<?php echo esc_attr($creds['api_key']); ?>" class="regular-text" />
                            </td>
                        </tr>
                        
                        <tr>
                            <th>Webhook URL</th>
                            <td>
                                <code><?php echo site_url('/wp-json/habitacr/v1/whatsapp/webhook'); ?></code>
                                <input type="hidden" name="webhook_url" value="<?php echo site_url('/wp-json/habitacr/v1/whatsapp/webhook'); ?>" />
                                <p class="description">Configura este URL en tu proveedor para recibir respuestas</p>
                            </td>
                        </tr>
                    </table>
                    
                    <p class="submit">
                        <button type="submit" name="save_api_settings" class="button button-primary">Guardar Configuración</button>
                    </p>
                </form>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>Estado del Sistema</h2>
                <?php $this->show_system_status(); ?>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>Guía Rápida - Meta Cloud API (Gratis)</h2>
                <ol>
                    <li><strong>Crear App en Meta:</strong> Ve a <a href="https://developers.facebook.com/apps/" target="_blank">developers.facebook.com</a></li>
                    <li><strong>Agregar WhatsApp:</strong> En tu app, agrega el producto "WhatsApp"</li>
                    <li><strong>Configurar número:</strong> En WhatsApp > Configuración > Número de teléfono</li>
                    <li><strong>Obtener credenciales:</strong>
                        <ul>
                            <li>Access Token: En WhatsApp > API Setup</li>
                            <li>Phone Number ID: En la misma sección</li>
                            <li>1000 mensajes gratis al mes incluidos</li>
                        </ul>
                    </li>
                    <li><strong>Verificar webhook:</strong> Configura el webhook con el token: habitacr2025</li>
                    <li><strong>Configurar aquí:</strong> Pega tus credenciales arriba</li>
                </ol>
                
                <h3>Ventajas de Meta Cloud API:</h3>
                <ul>
                    <li>✅ 1000 mensajes gratis cada mes</li>
                    <li>✅ Sin necesidad de tarjeta de crédito</li>
                    <li>✅ API oficial de WhatsApp</li>
                    <li>✅ Soporte para plantillas de mensajes</li>
                    <li>✅ Webhooks para respuestas en tiempo real</li>
                </ul>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#provider').change(function() {
                $('.twilio-settings, .meta-settings, .other-settings').hide();
                
                if($(this).val() === 'twilio') {
                    $('.twilio-settings').show();
                } else if($(this).val() === 'meta') {
                    $('.meta-settings').show();
                } else {
                    $('.other-settings').show();
                }
            }).trigger('change');
        });
        </script>
        <?php
    }
    
    /**
     * Show system status
     */
    private function show_system_status() {
        $status = $this->test_connection();
        
        if ($status['success']) {
            echo '<p style="color: green;">✅ API Conectada y Funcionando</p>';
            echo '<p>Mensajes disponibles este mes: ' . $status['remaining'] . '</p>';
        } else {
            echo '<p style="color: red;">❌ API No Configurada o Error</p>';
            echo '<p>Error: ' . $status['error'] . '</p>';
        }
    }
    
    /**
     * Test API connection
     */
    public function test_connection() {
        // Check credentials based on provider
        switch($this->api_credentials['provider']) {
            case 'meta':
                if (empty($this->api_credentials['meta_access_token']) || empty($this->api_credentials['meta_phone_id'])) {
                    return array('success' => false, 'error' => 'Credenciales Meta no configuradas');
                }
                return $this->test_meta_connection();
            case 'twilio':
                if (empty($this->api_credentials['account_sid']) || empty($this->api_credentials['auth_token'])) {
                    return array('success' => false, 'error' => 'Credenciales Twilio no configuradas');
                }
                return $this->test_twilio_connection();
            default:
                return array('success' => false, 'error' => 'Proveedor no soportado');
        }
    }
    
    /**
     * Test Meta Cloud API connection
     */
    private function test_meta_connection() {
        $url = 'https://graph.facebook.com/v18.0/' . $this->api_credentials['meta_phone_id'];
        
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_credentials['meta_access_token']
            )
        ));
        
        if (is_wp_error($response)) {
            return array('success' => false, 'error' => $response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (wp_remote_retrieve_response_code($response) === 200) {
            return array(
                'success' => true,
                'remaining' => 1000 // Meta free tier
            );
        }
        
        return array('success' => false, 'error' => $body['error']['message'] ?? 'Invalid credentials');
    }
    
    /**
     * Test Twilio connection
     */
    private function test_twilio_connection() {
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $this->api_credentials['account_sid'] . '.json';
        
        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode($this->api_credentials['account_sid'] . ':' . $this->api_credentials['auth_token'])
            )
        ));
        
        if (is_wp_error($response)) {
            return array('success' => false, 'error' => $response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (wp_remote_retrieve_response_code($response) === 200) {
            return array(
                'success' => true,
                'remaining' => 1000 // Twilio free tier
            );
        }
        
        return array('success' => false, 'error' => 'Invalid credentials');
    }
    
    /**
     * Send WhatsApp message via API
     */
    public function send_message($to, $message) {
        // Clean phone number
        $to = preg_replace('/[^0-9+]/', '', $to);
        if (!preg_match('/^\+/', $to)) {
            $to = '+506' . $to; // Add Costa Rica code
        }
        
        // Send based on provider
        switch($this->api_credentials['provider']) {
            case 'meta':
                return $this->send_meta_message($to, $message);
            case 'twilio':
                return $this->send_twilio_message($to, $message);
            default:
                return array('success' => false, 'error' => 'Provider not configured');
        }
    }
    
    /**
     * Send message via Meta Cloud API
     */
    private function send_meta_message($to, $message) {
        $url = 'https://graph.facebook.com/v18.0/' . $this->api_credentials['meta_phone_id'] . '/messages';
        
        $data = array(
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => array(
                'body' => $message
            )
        );
        
        $response = wp_remote_post($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_credentials['meta_access_token'],
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode($data)
        ));
        
        if (is_wp_error($response)) {
            return array('success' => false, 'error' => $response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (wp_remote_retrieve_response_code($response) === 200) {
            // Log message sent
            $this->log_message($to, $message, 'sent');
            return array('success' => true, 'message_id' => $body['messages'][0]['id']);
        }
        
        return array('success' => false, 'error' => $body['error']['message'] ?? 'Unknown error');
    }
    
    /**
     * Send message via Twilio
     */
    private function send_twilio_message($to, $message) {
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $this->api_credentials['account_sid'] . '/Messages.json';
        
        $data = array(
            'From' => 'whatsapp:' . $this->api_credentials['from_number'],
            'To' => 'whatsapp:' . $to,
            'Body' => $message
        );
        
        $response = wp_remote_post($url, array(
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode($this->api_credentials['account_sid'] . ':' . $this->api_credentials['auth_token'])
            ),
            'body' => $data
        ));
        
        if (is_wp_error($response)) {
            return array('success' => false, 'error' => $response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (wp_remote_retrieve_response_code($response) === 201) {
            // Log message sent
            $this->log_message($to, $message, 'sent');
            return array('success' => true, 'sid' => $body['sid']);
        }
        
        return array('success' => false, 'error' => $body['message'] ?? 'Unknown error');
    }
    
    /**
     * Log messages for tracking
     */
    private function log_message($to, $message, $status) {
        global $wpdb;
        $table = $wpdb->prefix . 'habitacr_whatsapp_log';
        
        $wpdb->insert($table, array(
            'phone' => $to,
            'message' => $message,
            'status' => $status,
            'sent_at' => current_time('mysql')
        ));
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_api_endpoints() {
        // Send message endpoint
        register_rest_route('habitacr/v1', '/whatsapp/send', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_send_message'),
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ));
        
        // Webhook for incoming messages
        register_rest_route('habitacr/v1', '/whatsapp/webhook', array(
            'methods' => array('GET', 'POST'),
            'callback' => array($this, 'webhook_handler'),
            'permission_callback' => '__return_true'
        ));
    }
    
    /**
     * API endpoint to send message
     */
    public function api_send_message($request) {
        $to = $request->get_param('to');
        $message = $request->get_param('message');
        
        if (empty($to) || empty($message)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Missing required parameters'
            ), 400);
        }
        
        $result = $this->send_message($to, $message);
        
        return new WP_REST_Response($result, $result['success'] ? 200 : 400);
    }
    
    /**
     * Handle incoming webhooks
     */
    public function webhook_handler($request) {
        // Webhook verification for Meta
        if ($request->get_method() === 'GET') {
            $mode = $request->get_param('hub.mode');
            $token = $request->get_param('hub.verify_token');
            $challenge = $request->get_param('hub.challenge');
            
            if ($mode === 'subscribe' && $token === 'habitacr2025') {
                return new WP_REST_Response($challenge, 200);
            }
            
            return new WP_REST_Response('Forbidden', 403);
        }
        
        // Log incoming message
        $body = $request->get_body();
        error_log('WhatsApp Webhook: ' . $body);
        
        // Process based on provider
        if ($this->api_credentials['provider'] === 'meta') {
            $data = json_decode($body, true);
            
            if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
                $message_data = $data['entry'][0]['changes'][0]['value']['messages'][0];
                $from = $message_data['from'];
                $message = $message_data['text']['body'] ?? '';
                
                // Log incoming message
                $this->log_message($from, $message, 'received');
            }
        } elseif ($this->api_credentials['provider'] === 'twilio') {
            $from = str_replace('whatsapp:', '', $request->get_param('From'));
            $message = $request->get_param('Body');
            
            // Log incoming message
            $this->log_message($from, $message, 'received');
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    /**
     * Schedule daily reminders
     */
    public function schedule_daily_reminders() {
        if (!wp_next_scheduled('habitacr_daily_whatsapp_reminders')) {
            // Schedule at 8:00 AM Costa Rica time
            $timezone = new DateTimeZone('America/Costa_Rica');
            $time = new DateTime('tomorrow 8:00am', $timezone);
            wp_schedule_event($time->getTimestamp(), 'daily', 'habitacr_daily_whatsapp_reminders');
        }
    }
    
    /**
     * Send daily reminders to agents
     */
    public function send_daily_reminders() {
        // Get all agents with WhatsApp configured
        $agents = get_users(array(
            'meta_key' => 'fave_agent_mobile',
            'meta_compare' => 'EXISTS'
        ));
        
        foreach ($agents as $agent) {
            $phone = get_user_meta($agent->ID, 'fave_agent_mobile', true);
            if (empty($phone)) continue;
            
            // Get agent's pending deals
            $message = $this->get_agent_reminder_message($agent->ID);
            
            // Send message
            $this->send_message($phone, $message);
        }
    }
    
    /**
     * Get formatted reminder message for agent
     */
    private function get_agent_reminder_message($agent_id) {
        global $wpdb;
        
        $today = date('Y-m-d');
        $message = "🔔 *RECORDATORIO DE SEGUIMIENTOS*\n\n";
        $message .= "Fecha: " . date('d/m/Y H:i') . "\n\n";
        
        // Get overdue deals
        $overdue_query = $wpdb->prepare("
            SELECT p.ID, pm1.meta_value as follow_up_date, pm2.meta_value as lead_id
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm1 ON p.ID = pm1.post_id AND pm1.meta_key = 'deal_fecha2'
            LEFT JOIN {$wpdb->postmeta} pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_houzez_deal_lead_id'
            WHERE p.post_type = 'houzez_deals'
            AND p.post_status = 'publish'
            AND p.post_author = %d
            AND pm1.meta_value < %s
            AND pm1.meta_value != ''
            ORDER BY pm1.meta_value ASC
        ", $agent_id, $today);
        
        $overdue = $wpdb->get_results($overdue_query);
        
        if (!empty($overdue)) {
            $message .= "🔴 *VENCIDOS* (" . count($overdue) . "):\n";
            foreach ($overdue as $deal) {
                $lead = Houzez_Leads::get_lead($deal->lead_id);
                if ($lead) {
                    $message .= "• " . ($lead->display_name ?: 'Cliente') . " - " . ($lead->mobile ?: 'Sin teléfono') . "\n";
                }
            }
            $message .= "\n";
        }
        
        // Get today's deals
        $today_query = $wpdb->prepare("
            SELECT p.ID, pm2.meta_value as lead_id
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm1 ON p.ID = pm1.post_id AND pm1.meta_key = 'deal_fecha2'
            LEFT JOIN {$wpdb->postmeta} pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_houzez_deal_lead_id'
            WHERE p.post_type = 'houzez_deals'
            AND p.post_status = 'publish'
            AND p.post_author = %d
            AND pm1.meta_value = %s
        ", $agent_id, $today);
        
        $today_deals = $wpdb->get_results($today_query);
        
        if (!empty($today_deals)) {
            $message .= "📅 *HOY* (" . count($today_deals) . "):\n";
            foreach ($today_deals as $deal) {
                $lead = Houzez_Leads::get_lead($deal->lead_id);
                if ($lead) {
                    $message .= "• " . ($lead->display_name ?: 'Cliente') . " - " . ($lead->mobile ?: 'Sin teléfono') . "\n";
                }
            }
            $message .= "\n";
        }
        
        if (empty($overdue) && empty($today_deals)) {
            $message .= "✅ ¡Todo al día! No tienes seguimientos pendientes.\n\n";
        } else {
            $message .= "⚡ *Acción requerida:* Contacta a estos clientes hoy.\n\n";
        }
        
        $message .= "👉 Ingresa al CRM: " . site_url('/board/?hpage=deals');
        
        return $message;
    }
}

// Initialize the API
new HabitaCR_WhatsApp_Business_API();

// Create database table for logs
function habitacr_create_whatsapp_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'habitacr_whatsapp_log';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id int(11) NOT NULL AUTO_INCREMENT,
        phone varchar(20) NOT NULL,
        message text NOT NULL,
        status varchar(20) NOT NULL,
        sent_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'habitacr_create_whatsapp_table');