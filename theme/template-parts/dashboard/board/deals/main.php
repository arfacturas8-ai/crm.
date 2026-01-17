<?php
global $deal_data;

// Handle WhatsApp number save
if (isset($_POST['habitacr_save_whatsapp']) && wp_verify_nonce($_POST['habitacr_nonce'], 'save_whatsapp')) {
    $phone = sanitize_text_field($_POST['habitacr_save_whatsapp']);
    update_user_meta(get_current_user_id(), 'fave_agent_mobile', $phone);
    
    // Set flag for showing success message
    $whatsapp_saved = true;
}

// Handle API configuration save
if (isset($_POST['habitacr_save_api']) && wp_verify_nonce($_POST['api_nonce'], 'save_api_config')) {
    $api_settings = array(
        'provider' => 'twilio',
        'account_sid' => sanitize_text_field($_POST['account_sid']),
        'auth_token' => sanitize_text_field($_POST['auth_token']),
        'from_number' => sanitize_text_field($_POST['from_number']),
        'api_key' => '',
        'webhook_url' => site_url('/wp-json/habitacr/v1/whatsapp/webhook')
    );
    
    update_option('habitacr_whatsapp_api', $api_settings);
    $api_saved = true;
}

// WhatsApp API Functions for Testing
if (!class_exists('HabitaCR_WhatsApp_Direct')) {
    class HabitaCR_WhatsApp_Direct {
        
        public static function generate_whatsapp_url($phone, $message) {
            // Clean phone number
            $phone = preg_replace('/[^0-9]/', '', $phone);
            
            // Add Costa Rica country code if missing
            if (!preg_match('/^506/', $phone)) {
                $phone = '506' . $phone;
            }
            
            // Build WhatsApp URL
            $whatsapp_url = 'https://api.whatsapp.com/send?phone=' . $phone . '&text=' . urlencode($message);
            
            return $whatsapp_url;
        }
        
        public static function get_test_message($phone = '') {
            $message = "🧪 *PRUEBA DE SISTEMA*\n\n";
            $message .= "¡Hola! Este es un mensaje de prueba del CRM HabitaCR.\n\n";
            $message .= "Si recibes este mensaje, el sistema está funcionando correctamente.\n\n";
            $message .= "📅 Fecha: " . date('d/m/Y H:i') . "\n";
            if($phone) {
                $message .= "📱 Número configurado: " . $phone . "\n";
            }
            $message .= "✅ Sistema WhatsApp: OK";
            
            return $message;
        }
        
        public static function get_reminder_message($overdue_count, $today_count) {
            $message = "📋 *RESUMEN DE SEGUIMIENTOS*\n";
            $message .= date('d/m/Y H:i') . "\n\n";
            
            if($overdue_count > 0) {
                $message .= "🔴 *VENCIDOS* (" . $overdue_count . "):\n";
                $message .= "• Cliente 1\n";
                $message .= "• Cliente 2\n";
                if($overdue_count > 2) {
                    $message .= "• ... y " . ($overdue_count - 2) . " más\n";
                }
                $message .= "\n";
            }
            
            if($today_count > 0) {
                $message .= "📅 *HOY* (" . $today_count . "):\n";
                $message .= "• Cliente A\n";
                if($today_count > 1) {
                    $message .= "• ... y " . ($today_count - 1) . " más\n";
                }
                $message .= "\n";
            }
            
            if($overdue_count == 0 && $today_count == 0) {
                $message .= "✅ ¡Todo al día! No tienes seguimientos pendientes.\n";
            }
            
            $message .= "\n👉 " . site_url('/board/?hpage=deals');
            
            return $message;
        }
    }
}

// Manejamos la lógica de las pestañas
$amarillo_tab = $verde_tab = $rojo_tab = '';
$dashboard_crm = houzez_get_template_link_2('template/user_dashboard_crm.php');

$amarillo_link = add_query_arg(array('hpage' => 'deals','tab' => 'active'), $dashboard_crm);
$verde_link    = add_query_arg(array('hpage' => 'deals','tab' => 'won'), $dashboard_crm);
$rojo_link     = add_query_arg(array('hpage' => 'deals','tab' => 'lost'), $dashboard_crm);

// Determinar qué pestaña está activa y qué estado filtrar
$status_filter = 'active'; // Por defecto
if( isset($_GET['tab']) && $_GET['tab'] == 'active' ) {
    $amarillo_tab = 'active';
    $status_filter = 'active';
} else if( isset($_GET['tab']) && $_GET['tab'] == 'won' ) {
    $verde_tab = 'active';
    $status_filter = 'won';
} else if( isset($_GET['tab']) && $_GET['tab'] == 'lost' ) {
    $rojo_tab = 'active';
    $status_filter = 'lost';
} else {
    $amarillo_tab = 'active';
    $status_filter = 'active';
}

// Obtener deals filtrados por estado
$deals = Houzez_Deals::get_deals($status_filter);
?>
<header class="header-main-wrap dashboard-header-main-wrap">
    <div class="dashboard-header-wrap">
        <div class="d-flex align-items-center">
            <div class="dashboard-header-left flex-grow-1">
                <h1><?php echo 'Seguimiento'; ?></h1>         
            </div>
            <div class="dashboard-header-right">
                <a class="btn btn-primary open-close-deal-panel" href="#">
                    <?php echo 'Agregar Nuevo Seguimiento'; ?>
                </a>
            </div>
        </div>
    </div>
</header>

<section class="dashboard-content-wrap deals-main-wrap">
    <div class="dashboard-content-inner-wrap">
        <?php 
        // Today's reminders widget
        $today = date('Y-m-d');
        $overdue_deals = 0;
        $today_deals = 0;
        
        foreach ($deals['data']['results'] as $deal) {
            $follow_up_date = get_post_meta($deal->deal_id, 'deal_fecha2', true);
            if($follow_up_date) {
                if($follow_up_date < $today) {
                    $overdue_deals++;
                } elseif($follow_up_date == $today) {
                    $today_deals++;
                }
            }
        }
        ?>
        
        <!-- Agent Dashboard Widget -->
        <div class="dashboard-content-block-wrap">
            <div class="dashboard-content-block">
                <div class="row">
                    <!-- Follow-up Stats -->
                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="stat-card <?php echo $overdue_deals > 0 ? 'stat-urgent' : ''; ?>">
                                    <div class="stat-icon">
                                        <i class="houzez-icon icon-alarm-clock"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 class="stat-number"><?php echo $overdue_deals; ?></h3>
                                        <p class="stat-label">Vencidos</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card stat-today">
                                    <div class="stat-icon">
                                        <i class="houzez-icon icon-calendar-3"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 class="stat-number"><?php echo $today_deals; ?></h3>
                                        <p class="stat-label">Para Hoy</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <?php 
                                $total_active = 0;
                                foreach ($deals['data']['results'] as $deal) {
                                    if(get_post_meta($deal->deal_id, 'deal_fecha2', true)) {
                                        $total_active++;
                                    }
                                }
                                ?>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="houzez-icon icon-single-neutral-actions-text-preview"></i>
                                    </div>
                                    <div class="stat-content">
                                        <h3 class="stat-number"><?php echo $total_active; ?></h3>
                                        <p class="stat-label">Total Activos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- WhatsApp Actions -->
                    <div class="col-md-4">
                        <div class="whatsapp-card">
                            <h5><i class="houzez-icon icon-social-media-whatsapp" style="color: #25D366;"></i> WhatsApp Recordatorios</h5>
                            <?php 
                            // Show success message if WhatsApp was just saved
                            if (isset($whatsapp_saved) && $whatsapp_saved) {
                                echo '<div class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 15px;">
                                    <i class="houzez-icon icon-check-circle"></i> ¡WhatsApp configurado correctamente!
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>';
                            }
                            
                            // Show success message if API was just configured
                            if (isset($api_saved) && $api_saved) {
                                echo '<div class="alert alert-success alert-dismissible fade show" role="alert" style="margin-bottom: 15px;">
                                    <i class="houzez-icon icon-check-circle"></i> ¡API de WhatsApp configurada! Los mensajes ahora se enviarán automáticamente.
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>';
                            }
                            
                            $agent_phone = get_user_meta(get_current_user_id(), 'fave_agent_mobile', true);
                            $whatsapp_enabled = get_user_meta(get_current_user_id(), 'agent_whatsapp_reminders', true);
                            
                            if(empty($agent_phone)) { ?>
                                <p class="text-muted small">Configura tu WhatsApp para recibir recordatorios automáticos</p>
                                <button class="btn btn-success btn-sm btn-block mb-2" onclick="setupAgentWhatsApp()">
                                    <i class="houzez-icon icon-settings"></i> Configurar
                                </button>
                            <?php } else { ?>
                                <p class="text-success small mb-2">
                                    <i class="houzez-icon icon-check"></i> WhatsApp: <?php echo $agent_phone; ?>
                                </p>
                                <button class="btn btn-secondary btn-sm btn-block mb-2" onclick="setupAgentWhatsApp()">
                                    <i class="houzez-icon icon-edit"></i> Cambiar Número
                                </button>
                                <?php if($whatsapp_enabled == 'yes') { ?>
                                    <p class="text-muted small">Recordatorios diarios a las 8:00 AM</p>
                                <?php } ?>
                                <button class="btn btn-outline-primary btn-sm btn-block mb-2" onclick="sendAgentWhatsAppReminder()">
                                    <i class="houzez-icon icon-alarm-clock"></i> Recibir Resumen Ahora
                                </button>
                                <?php 
                                $api_creds = get_option('habitacr_whatsapp_api', array());
                                if(empty($api_creds['account_sid']) || empty($api_creds['auth_token'])) { ?>
                                    <button class="btn btn-warning btn-sm btn-block mb-2" onclick="configureWhatsAppAPI()">
                                        <i class="houzez-icon icon-api"></i> Configurar API (1000 msg gratis)
                                    </button>
                                <?php } else { ?>
                                    <p class="text-success small mb-2">
                                        <i class="houzez-icon icon-check"></i> API Configurada
                                    </p>
                                <?php } ?>
                                <?php if($overdue_deals > 0) { ?>
                                    <button class="btn btn-warning btn-sm btn-block" onclick="showDetailedReminders()">
                                        <i class="houzez-icon icon-info-circle"></i> Ver Detalles (<?php echo $overdue_deals; ?> vencidos)
                                    </button>
                                <?php } ?>
                            <?php } ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <?php 
        // Incluimos el archivo de estadísticas (arriba)
        get_template_part('template-parts/dashboard/statistics/statistic-deals'); 
        ?>
    </div>
    
    <div class="dashboard-content-block-wrap">
        <div class="dashboard-tool-block">
            <div class="dashboard-tool-buttons-block">
                <div class="dashboard-tool-button">
                    <button id="export-deals" class="btn btn-primary-outlined">
                        <span class="btn-loader houzez-loader-js"></span>
                        <?php echo 'Exportar'; ?>
                    </button>
                </div>
                <div class="dashboard-tool-button">
                    <button id="bulk-delete-deals" class="btn btn-grey-outlined">
                        <?php echo 'Eliminar'; ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="deals-table-wrap">
        <ul class="nav nav-pills deals-nav-tab" role="tablist">
            <li class="nav-item">
                <a class="nav-link <?php echo esc_attr($amarillo_tab); ?>" href="<?php echo esc_url($amarillo_link); ?>">
                    <?php echo 'Dar seguimiento'; ?> 
                    (<?php echo Houzez_Deals::get_total_deals_by_group('active'); ?>)
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo esc_attr($verde_tab); ?>" href="<?php echo esc_url($verde_link); ?>">
                    <?php echo 'Cliente potencial'; ?>
                    (<?php echo Houzez_Deals::get_total_deals_by_group('won'); ?>)
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo esc_attr($rojo_tab); ?>" href="<?php echo esc_url($rojo_link); ?>">
                    <?php echo 'Descartado'; ?>
                    (<?php echo Houzez_Deals::get_total_deals_by_group('lost'); ?>)
                </a>
            </li>
        </ul>

        <div class="deal-content-wrap p-0">
            <table class="dashboard-table table-lined deals-table responsive-table">
                <thead>
                    <tr>
                        <th>
                            <label class="control control--checkbox">
                                <input type="checkbox" id="deals_select_all" name="deals_select_all">
                                <span class="control__indicator"></span>
                            </label>
                        </th>
                        <th><?php echo 'Nombre de Contacto'; ?></th>
                        <th><?php echo 'Busca'; ?></th>
                        <th><?php echo 'Propiedad'; ?></th>
                        <th><?php echo 'Estado'; ?></th>
                        <th><?php echo 'Detalles Contacto'; ?></th>
                        <th><?php echo 'Fecha Contacto'; ?></th>
                        <th><?php echo 'Seguimiento'; ?></th>
                        <th><?php echo 'Fecha Seguimiento'; ?></th>
                        <th><?php echo 'Detalles Seguimiento'; ?></th>
                        <th><?php echo 'Visita confirmada'; ?></th>
                        <th><?php echo 'Calificación cliente'; ?></th>
                        <th><?php echo 'Próximo paso'; ?></th>
                        <th><?php echo 'Teléfono'; ?></th>
                        <th><?php echo 'Correo'; ?></th>
                        <th><?php echo 'Acciones'; ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    foreach ($deals['data']['results'] as $deal_data) { 
                        get_template_part('template-parts/dashboard/board/deals/deal-item');
                    }
                    ?>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="7">
                            <?php get_template_part('template-parts/dashboard/board/records-html'); ?>
                        </td>
                        <td colspan="5" class="text-right no-wrap">
                            <div class="leads-pagination-wrap">
                                <?php
                                $total_pages = ceil($deals['data']['total_records'] / $deals['data']['items_per_page']);
                                $current_page = $deals['data']['page'];
                                houzez_crm_pagination($total_pages, $current_page);
                                ?>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div><!-- deal-content-wrap -->
    </div><!-- deals-table-wrap -->
</section>
<section class="dashboard-side-wrap">
    <?php get_template_part('template-parts/dashboard/side-wrap'); ?>
</section>

<script>
// Define ajaxurl for WordPress AJAX
var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';

jQuery(document).ready(function($) {
    // Auto-save functionality for deal fields
    $('.deals-table').on('change', 'input, select, textarea', function() {
        var $this = $(this);
        var dealId = $this.closest('tr').data('id');
        var fieldName = $this.attr('name').replace('_' + dealId, '');
        var fieldValue = $this.val();
        
        // Save via AJAX
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_save_deal_field',
                deal_id: dealId,
                field_name: fieldName,
                field_value: fieldValue,
                nonce: '<?php echo wp_create_nonce('save_deal_field'); ?>'
            },
            success: function(response) {
                // Show brief success indicator
                $this.css('border-color', '#28a745');
                setTimeout(function() {
                    $this.css('border-color', '');
                }, 1000);
            }
        });
    });
    
    // Export functionality
    $('#export-deals').on('click', function() {
        var $btn = $(this);
        $btn.find('.btn-loader').addClass('loader-show');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_export_deals',
                nonce: '<?php echo wp_create_nonce('export_deals'); ?>'
            },
            success: function(response) {
                $btn.find('.btn-loader').removeClass('loader-show');
                if(response.success) {
                    window.location.href = response.data.file_url;
                }
            }
        });
    });
    
    // Bulk delete functionality
    $('#bulk-delete-deals').on('click', function() {
        var selected = [];
        $('.deal-bulk-delete:checked').each(function() {
            selected.push($(this).val());
        });
        
        if(selected.length === 0) {
            alert('Por favor seleccione al menos un seguimiento para eliminar');
            return;
        }
        
        if(confirm('¿Está seguro de que desea eliminar los seguimientos seleccionados?')) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'houzez_delete_deals_bulk',
                    deal_ids: selected,
                    nonce: '<?php echo wp_create_nonce('delete_deals_bulk'); ?>'
                },
                success: function(response) {
                    location.reload();
                }
            });
        }
    });
    
    // Select all checkbox
    $('#deals_select_all').on('change', function() {
        $('.deal-bulk-delete').prop('checked', $(this).is(':checked'));
    });
    
    // Handle edit deal click
    $(document).on('click', '.crm-edit-deal-js', function(e) {
        e.preventDefault();
        var dealId = $(this).data('id');
        var $row = $(this).closest('tr');
        
        // Get current values from the row
        var dealData = {
            deal_busca: $row.find('.deal-busca').val(),
            deal_propiedad: $row.find('.deal-propiedad').val(),
            deal_estado: $row.find('.deal-estado').val(),
            deal_detalles: $row.find('.deal-detalles').val(),
            deal_fecha1: $row.find('.deal-fecha1').val(),
            deal_seguimiento: $row.find('.deal-seguimiento').val(),
            deal_fecha2: $row.find('.deal-fecha2').val(),
            deal_detalles2: $row.find('.deal-detalles2').val(),
            deal_visita_confirmada: $row.find('.deal-visita').val(),
            deal_calificacion: $row.find('.deal-calificacion').val(),
            deal_proximo_paso: $row.find('.deal-proximo-paso').val()
        };
        
        // Populate the edit form
        $('#deal-form').find('input[name="deal_id"]').remove();
        $('#deal-form').append('<input type="hidden" name="deal_id" value="' + dealId + '">');
        
        // Set form action for editing
        $('#deal-form input[name="action"]').val('houzez_crm_edit_deal');
        
        // Populate fields
        $.each(dealData, function(key, value) {
            var $field = $('#deal-form').find('[name="' + key + '"]');
            if($field.length) {
                $field.val(value);
                if($field.hasClass('selectpicker')) {
                    $field.selectpicker('refresh');
                }
            }
        });
        
        // Change button text
        $('#add_deal').text('Actualizar Seguimiento');
    });
    
    // Property search autocomplete (only if jQuery UI is available)
    if($.fn.autocomplete) {
        $('.deal-propiedad').each(function() {
            var $input = $(this);
            $input.autocomplete({
            source: function(request, response) {
                $.ajax({
                    url: ajaxurl,
                    dataType: 'json',
                    data: {
                        action: 'houzez_search_properties',
                        term: request.term,
                        nonce: '<?php echo wp_create_nonce('search_properties'); ?>'
                    },
                    success: function(data) {
                        response(data);
                    }
                });
            },
            minLength: 2,
            select: function(event, ui) {
                $(this).val(ui.item.label);
                $(this).data('property-id', ui.item.value);
                return false;
            }
            });
        });
    }
});

// Initialize field saving on page load
jQuery(window).on('load', function() {
    // Make all fields save on change
    jQuery('.deals-table').find('input, select, textarea').each(function() {
        jQuery(this).attr('data-original-value', jQuery(this).val());
    });
    
    // Add visual feedback for saved fields
    jQuery(document).ajaxComplete(function(event, xhr, settings) {
        if(settings.data && settings.data.includes('houzez_save_deal_field')) {
            // Field was saved successfully
        }
    });
});

// PHP AJAX handlers would go in functions.php or a plugin file:
// add_action('wp_ajax_houzez_save_deal_field', 'houzez_save_deal_field_callback');
// add_action('wp_ajax_houzez_search_properties', 'houzez_search_properties_callback');
// add_action('wp_ajax_houzez_export_deals', 'houzez_export_deals_callback');
// add_action('wp_ajax_houzez_delete_deals_bulk', 'houzez_delete_deals_bulk_callback');
</script>

<style>
/* Deals table improvements */
.deals-table input[type="text"],
.deals-table input[type="date"],
.deals-table textarea,
.deals-table select {
    width: 100%;
    min-width: 120px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 13px;
}

.deals-table textarea {
    min-height: 50px;
    resize: vertical;
}

.deals-table td {
    vertical-align: middle;
}

/* WhatsApp link styling */
.whatsapp-link {
    color: #25D366 !important;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.whatsapp-link:hover {
    color: #128C7E !important;
    text-decoration: underline;
}

/* Checkbox styling */
.deal-bulk-delete {
    cursor: pointer;
}

/* Property autocomplete */
.ui-autocomplete {
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.ui-autocomplete li {
    padding: 10px;
    cursor: pointer;
}

.ui-autocomplete li:hover {
    background-color: #f5f5f5;
}

/* Responsive table */
@media (max-width: 1200px) {
    .deals-table {
        font-size: 12px;
    }
    
    .deals-table input,
    .deals-table select,
    .deals-table textarea {
        min-width: 100px;
        font-size: 12px;
    }
}
</style>

<script>
// Define ajaxurl for WordPress AJAX
var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';

jQuery(document).ready(function($) {
    // Auto-save functionality for deal fields
    $('.deals-table').on('change', 'input, select, textarea', function() {
        var $this = $(this);
        var dealId = $this.closest('tr').data('id');
        var fieldName = $this.attr('name').replace('_' + dealId, '');
        var fieldValue = $this.val();
        
        // Save via AJAX
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'save_deal_field',
                deal_id: dealId,
                field_name: fieldName,
                field_value: fieldValue,
                nonce: '<?php echo wp_create_nonce('save_deal_field'); ?>'
            },
            success: function(response) {
                // Show brief success indicator
                $this.css('border-color', '#28a745');
                setTimeout(function() {
                    $this.css('border-color', '');
                }, 1000);
            }
        });
    });
    
    // Export functionality
    $('#export-deals').on('click', function() {
        var $btn = $(this);
        $btn.find('.btn-loader').addClass('loader-show');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_export_deals',
                nonce: '<?php echo wp_create_nonce('export_deals'); ?>'
            },
            success: function(response) {
                $btn.find('.btn-loader').removeClass('loader-show');
                if(response.success) {
                    window.location.href = response.data.file_url;
                }
            }
        });
    });
});
</script>

<script>
</script>

<script>
// Configure WhatsApp API
function configureWhatsAppAPI() {
    var modal = '<div class="api-config-modal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10001; min-width: 500px; max-width: 600px;">' +
        '<h4 style="margin-bottom: 20px;">Configurar WhatsApp Business API</h4>' +
        '<p style="margin-bottom: 20px;">Con Twilio tienes <strong>1000 mensajes gratis por mes</strong></p>' +
        '<form id="api-config-form">' +
        '<div style="margin-bottom: 15px;">' +
        '<label>Account SID:</label>' +
        '<input type="text" id="api-account-sid" class="form-control" placeholder="ACxxxxxxxxxxxxx" required>' +
        '<small class="text-muted">Encuéntralo en <a href="https://console.twilio.com" target="_blank">console.twilio.com</a></small>' +
        '</div>' +
        '<div style="margin-bottom: 15px;">' +
        '<label>Auth Token:</label>' +
        '<input type="password" id="api-auth-token" class="form-control" placeholder="Tu token de autenticación" required>' +
        '</div>' +
        '<div style="margin-bottom: 15px;">' +
        '<label>Número WhatsApp (Twilio):</label>' +
        '<input type="text" id="api-from-number" class="form-control" placeholder="+14155238886" value="+14155238886" required>' +
        '<small class="text-muted">Usa el número de prueba de Twilio</small>' +
        '</div>' +
        '<div style="margin-top: 20px;">' +
        '<button type="submit" class="btn btn-primary">Guardar Configuración</button> ' +
        '<button type="button" class="btn btn-secondary" onclick="closeAPIModal()">Cancelar</button>' +
        '</div>' +
        '</form>' +
        '<hr style="margin: 20px 0;">' +
        '<p><strong>Guía Rápida:</strong></p>' +
        '<ol style="font-size: 14px;">' +
        '<li>Crea cuenta gratis en <a href="https://www.twilio.com/try-twilio" target="_blank">twilio.com</a></li>' +
        '<li>Activa WhatsApp en: Messaging > Try it Out > WhatsApp</li>' +
        '<li>Copia tu Account SID y Auth Token del Dashboard</li>' +
        '<li>Pega las credenciales aquí</li>' +
        '</ol>' +
        '</div>';
    
    jQuery('body').append(modal);
    jQuery('body').append('<div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;"></div>');
    
    // Handle form submission
    jQuery('#api-config-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = jQuery('<form>', {
            'method': 'POST',
            'action': window.location.href
        });
        
        formData.append(jQuery('<input>', {
            'type': 'hidden',
            'name': 'habitacr_save_api',
            'value': '1'
        }));
        
        formData.append(jQuery('<input>', {
            'type': 'hidden',
            'name': 'account_sid',
            'value': jQuery('#api-account-sid').val()
        }));
        
        formData.append(jQuery('<input>', {
            'type': 'hidden',
            'name': 'auth_token',
            'value': jQuery('#api-auth-token').val()
        }));
        
        formData.append(jQuery('<input>', {
            'type': 'hidden',
            'name': 'from_number',
            'value': jQuery('#api-from-number').val()
        }));
        
        formData.append(jQuery('<input>', {
            'type': 'hidden',
            'name': 'api_nonce',
            'value': '<?php echo wp_create_nonce('save_api_config'); ?>'
        }));
        
        jQuery('body').append(formData);
        formData.submit();
    });
}

function closeAPIModal() {
    jQuery('.api-config-modal, .modal-backdrop').remove();
}

// Setup agent WhatsApp - Direct save without AJAX
function setupAgentWhatsApp() {
    var currentPhone = '<?php echo get_user_meta(get_current_user_id(), "fave_agent_mobile", true); ?>';
    var promptMsg = currentPhone ? 
        'Tu número actual: ' + currentPhone + '\n\nIngresa tu nuevo número de WhatsApp (ejemplo: 88881234):' :
        'Ingresa tu número de WhatsApp (ejemplo: 88881234):';
    
    var phone = prompt(promptMsg);
    if(phone) {
        // Clean and format phone
        var cleanPhone = phone.replace(/[^0-9]/g, '');
        if(!cleanPhone.startsWith('506')) {
            cleanPhone = '506' + cleanPhone;
        }
        
        // Show confirmation
        if(confirm('Número a configurar: +' + cleanPhone + '\n\n¿Es correcto?')) {
            // Save directly via form submission
            var form = jQuery('<form>', {
                'method': 'POST',
                'action': window.location.href
            });
            
            form.append(jQuery('<input>', {
                'type': 'hidden',
                'name': 'habitacr_save_whatsapp',
                'value': phone
            }));
            
            form.append(jQuery('<input>', {
                'type': 'hidden',
                'name': 'habitacr_nonce',
                'value': '<?php echo wp_create_nonce('save_whatsapp'); ?>'
            }));
            
            jQuery('body').append(form);
            form.submit();
        }
    }
}

// Show detailed reminders
function showDetailedReminders() {
    var overdueList = [];
    jQuery('tr.overdue-deal').each(function() {
        var name = jQuery(this).find('td[data-label="Nombre de Contacto"]').text().trim();
        var date = jQuery(this).find('.deal-fecha2').val();
        var phone = jQuery(this).find('.deal-phone').text().trim();
        overdueList.push({name: name, date: date, phone: phone});
    });
    
    var message = '⚠️ CLIENTES CON SEGUIMIENTO VENCIDO\n\n';
    overdueList.forEach(function(client) {
        var daysAgo = Math.floor((new Date() - new Date(client.date)) / (1000 * 60 * 60 * 24));
        message += '• ' + client.name + '\n';
        message += '  📱 ' + client.phone + '\n';
        message += '  📅 Vencido hace ' + daysAgo + ' días\n\n';
    });
    
    message += '💡 Usa el botón "Recordar" para contactar a cada cliente.';
    
    alert(message);
}


// Send reminder to agent's WhatsApp - Using API
function sendAgentWhatsAppReminder() {
    console.log('Sending agent WhatsApp reminder via API...');
    
    var phone = '<?php echo get_user_meta(get_current_user_id(), "fave_agent_mobile", true); ?>';
    
    if(!phone) {
        alert('No tienes WhatsApp configurado.\n\nUsa el botón "Configurar" primero.');
        return;
    }
    
    // Check if API is configured
    var apiConfigured = <?php 
        $api_creds = get_option('habitacr_whatsapp_api', array());
        echo (!empty($api_creds['account_sid']) && !empty($api_creds['auth_token'])) ? 'true' : 'false';
    ?>;
    
    if(!apiConfigured) {
        // Fallback to direct WhatsApp Web
        var cleanPhone = phone.replace(/[^0-9]/g, '');
        if(!cleanPhone.startsWith('506')) {
            cleanPhone = '506' + cleanPhone;
        }
        
        var message = generateReminderMessage();
        var whatsappUrl = 'https://api.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(message);
        
        if(confirm('La API no está configurada. ¿Abrir WhatsApp Web con el resumen?')) {
            window.open(whatsappUrl, '_blank');
        }
        return;
    }
    
    // Send via API
    jQuery.ajax({
        url: '<?php echo site_url('/wp-json/habitacr/v1/whatsapp/send'); ?>',
        type: 'POST',
        headers: {
            'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
        },
        data: {
            to: phone,
            message: generateReminderMessage()
        },
        success: function(response) {
            if(response.success) {
                alert('✅ Recordatorio enviado por WhatsApp!');
            } else {
                alert('❌ Error: ' + response.error);
            }
        },
        error: function(xhr) {
            alert('❌ Error al enviar mensaje. Revisa la configuración de la API.');
        }
    });
}

// Generate reminder message
function generateReminderMessage() {
    var overdueCount = <?php echo $overdue_deals; ?>;
    var todayCount = <?php echo $today_deals; ?>;
    
    var message = "🔔 *RECORDATORIO DE SEGUIMIENTOS*\n\n";
    message += "Fecha: " + new Date().toLocaleString('es-CR') + "\n\n";
    
    // Get overdue and today's deals from the page
    var overdueDeals = [];
    var todayDeals = [];
    
    jQuery('tr.overdue-deal').each(function() {
        var name = jQuery(this).find('td[data-label="Nombre de Contacto"]').text().trim();
        var phone = jQuery(this).find('.deal-phone').text().trim();
        overdueDeals.push({name: name, phone: phone});
    });
    
    jQuery('tr.today-deal').each(function() {
        var name = jQuery(this).find('td[data-label="Nombre de Contacto"]').text().trim();
        var phone = jQuery(this).find('.deal-phone').text().trim();
        todayDeals.push({name: name, phone: phone});
    });
    
    if(overdueDeals.length > 0) {
        message += "🔴 *VENCIDOS* (" + overdueDeals.length + "):\n";
        overdueDeals.forEach(function(deal) {
            message += "• " + deal.name + " - " + deal.phone + "\n";
        });
        message += "\n";
    }
    
    if(todayDeals.length > 0) {
        message += "📅 *HOY* (" + todayDeals.length + "):\n";
        todayDeals.forEach(function(deal) {
            message += "• " + deal.name + " - " + deal.phone + "\n";
        });
        message += "\n";
    }
    
    if(overdueDeals.length === 0 && todayDeals.length === 0) {
        message += "✅ ¡Todo al día! No tienes seguimientos pendientes.\n\n";
    } else {
        message += "⚡ *Acción requerida:* Contacta a estos clientes hoy.\n\n";
    }
    
    message += "👉 Ingresa al CRM: " + window.location.href;
    
    return message;
}

// Original function for reference
function sendAgentWhatsAppReminderOld() {
    // Get agent's phone number from their profile
    var agentPhone = '<?php 
        $current_user = wp_get_current_user();
        $agent_phone = get_user_meta($current_user->ID, "fave_agent_mobile", true);
        if(empty($agent_phone)) {
            $agent_phone = get_user_meta($current_user->ID, "fave_author_phone", true);
        }
        echo preg_replace("/[^0-9]/", "", $agent_phone);
    ?>';
    
    if(!agentPhone) {
        var newPhone = prompt('Por favor ingresa tu número de WhatsApp (solo números, sin espacios):');
        if(newPhone) {
            // Save phone number for future use
            jQuery.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'save_agent_whatsapp',
                    phone: newPhone,
                    nonce: '<?php echo wp_create_nonce('save_agent_phone'); ?>'
                },
                success: function() {
                    agentPhone = newPhone;
                    sendAgentReminderMessage(agentPhone);
                }
            });
        }
    } else {
        sendAgentReminderMessage(agentPhone);
    }
}

function sendAgentReminderMessage(agentPhone) {
    // Ensure phone has Costa Rica code
    if (!agentPhone.startsWith('506')) {
        agentPhone = '506' + agentPhone;
    }
    
    var overdueCount = jQuery('tr.overdue-deal').length;
    var todayCount = jQuery('tr.today-deal').length;
    var agentName = '<?php echo esc_js($current_user->display_name); ?>';
    
    var message = '🔔 *RECORDATORIO DE SEGUIMIENTOS - ' + agentName + '*\n\n';
    message += '📅 Fecha: ' + new Date().toLocaleDateString('es-CR') + '\n\n';
    
    if(overdueCount > 0) {
        message += '🔴 *VENCIDOS: ' + overdueCount + ' seguimientos*\n';
        jQuery('tr.overdue-deal').each(function() {
            var name = jQuery(this).find('td[data-label="Nombre de Contacto"]').text().trim();
            var date = jQuery(this).find('.deal-fecha2').val();
            message += '• ' + name + ' (Vencido: ' + date + ')\n';
        });
        message += '\n';
    }
    
    if(todayCount > 0) {
        message += '🟡 *HOY: ' + todayCount + ' seguimientos*\n';
        jQuery('tr.today-deal').each(function() {
            var name = jQuery(this).find('td[data-label="Nombre de Contacto"]').text().trim();
            message += '• ' + name + '\n';
        });
        message += '\n';
    }
    
    if(overdueCount === 0 && todayCount === 0) {
        message += '✅ ¡Excelente! No tienes seguimientos pendientes.\n';
    } else {
        message += '⚡ *Acción requerida:* Por favor contacta a estos clientes lo antes posible.\n';
    }
    
    message += '\n👉 Ingresa al CRM: ' + window.location.href;
    
    // Open WhatsApp with the message
    var whatsappUrl = 'https://wa.me/' + agentPhone + '?text=' + encodeURIComponent(message);
    window.open(whatsappUrl, '_blank');
    
    // Log reminder sent
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'log_agent_reminder',
            type: 'manual_whatsapp',
            nonce: '<?php echo wp_create_nonce('log_reminder'); ?>'
        }
    });
}

// Agent reminder functions
function showAgentReminder(dealId, contactName) {
    var today = new Date().toLocaleDateString('es-CR');
    var message = '🔔 RECORDATORIO: Debes contactar a ' + contactName + ' hoy (' + today + ')\n\n' +
                  'Este cliente tiene un seguimiento pendiente. Por favor contacta al cliente lo antes posible.';
    
    if(confirm(message)) {
        // Open deal details or WhatsApp
        var phoneLink = jQuery('tr[data-id="' + dealId + '"]').find('.whatsapp-link');
        if(phoneLink.length) {
            sendWhatsAppToClient(phoneLink.attr('href').replace('https://wa.me/', ''), contactName, dealId);
        }
    }
}

// WhatsApp to client functions
function sendWhatsAppToClient(phoneNumber, contactName, dealId) {
    var templates = [
        'Hola ' + contactName + '! Soy de HabitaCR. ¿Cómo va tu búsqueda de propiedades? ¿Hay algo en lo que pueda ayudarte?',
        'Hola ' + contactName + '! Te escribo para dar seguimiento a tu búsqueda. ¿Has encontrado algo de tu interés?',
        'Hola ' + contactName + '! Quería saber si sigues interesado/a en las propiedades que vimos. ¿Te gustaría agendar una visita?'
    ];
    
    var message = templates[Math.floor(Math.random() * templates.length)];
    var whatsappUrl = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
    window.open(whatsappUrl, '_blank');
    
    // Update last contact date
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'houzez_update_deal_contact_date',
            deal_id: dealId,
            nonce: '<?php echo wp_create_nonce('update_contact_date'); ?>'
        }
    });
}

function showBulkAgentReminders() {
    var overdueDeals = [];
    jQuery('tr.overdue-deal').each(function() {
        var $row = jQuery(this);
        var dealId = $row.data('id');
        var name = $row.find('td[data-label="Nombre de Contacto"]').text().trim();
        var followUpDate = $row.find('.deal-fecha2').val();
        overdueDeals.push({id: dealId, name: name, date: followUpDate});
    });
    
    if(overdueDeals.length === 0) {
        alert('¡Excelente! No tienes seguimientos vencidos.');
        return;
    }
    
    var message = '⚠️ ATENCIÓN: Tienes ' + overdueDeals.length + ' seguimientos vencidos\n\n';
    message += 'Clientes pendientes de contactar:\n';
    
    overdueDeals.forEach(function(deal) {
        message += '• ' + deal.name + ' (Vencido: ' + deal.date + ')\n';
    });
    
    message += '\n¿Deseas ver el detalle de cada uno?';
    
    if(confirm(message)) {
        // Show detailed reminders
        overdueDeals.forEach(function(deal, index) {
            setTimeout(function() {
                showAgentReminder(deal.id, deal.name);
            }, index * 1000);
        });
    }
}

// Mark as contacted functionality
jQuery(document).on('click', '.mark-contacted', function(e) {
    e.preventDefault();
    var $btn = jQuery(this);
    var dealId = $btn.data('deal-id');
    
    $btn.prop('disabled', true).text('Actualizando...');
    
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'houzez_mark_deal_contacted',
            deal_id: dealId,
            nonce: '<?php echo wp_create_nonce('mark_contacted'); ?>'
        },
        success: function(response) {
            if(response.success) {
                $btn.text('✓ Actualizado');
                setTimeout(function() {
                    location.reload();
                }, 1000);
            } else {
                $btn.prop('disabled', false).text('✓ Contactado');
            }
        }
    });
});

// Add note functionality
jQuery(document).on('click', '.add-note', function(e) {
    e.preventDefault();
    var dealId = jQuery(this).data('deal-id');
    var note = prompt('Agregar nota de seguimiento:');
    
    if(note && note.trim() !== '') {
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_add_deal_note',
                deal_id: dealId,
                note: note,
                nonce: '<?php echo wp_create_nonce('add_deal_note'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    alert('Nota agregada correctamente');
                }
            }
        });
    }
});

// Schedule follow-up functionality - Direct implementation without AJAX
jQuery(document).on('click', '.schedule-follow-up', function(e) {
    e.preventDefault();
    var dealId = jQuery(this).data('deal-id');
    var $row = jQuery('tr[data-id="' + dealId + '"]');
    var clientName = $row.find('td[data-label="Nombre de Contacto"]').text().trim();
    
    var modal = '<div class="follow-up-modal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10001; min-width: 400px;">' +
        '<h4 style="margin-bottom: 20px;">Programar Seguimiento</h4>' +
        '<p style="margin-bottom: 20px;">Cliente: <strong>' + clientName + '</strong></p>' +
        '<div class="follow-up-options" style="display: flex; flex-direction: column; gap: 10px;">' +
        '<button class="btn btn-primary schedule-follow-up-btn" data-days="1" style="padding: 12px;">📅 Mañana</button>' +
        '<button class="btn btn-primary schedule-follow-up-btn" data-days="3" style="padding: 12px;">📅 En 3 días</button>' +
        '<button class="btn btn-primary schedule-follow-up-btn" data-days="7" style="padding: 12px;">📅 En 1 semana</button>' +
        '<button class="btn btn-primary schedule-follow-up-btn" data-days="14" style="padding: 12px;">📅 En 2 semanas</button>' +
        '<button class="btn btn-primary schedule-follow-up-btn" data-days="30" style="padding: 12px;">📅 En 1 mes</button>' +
        '</div>' +
        '<button class="btn btn-secondary close-follow-up-modal" style="margin-top: 20px; width: 100%;">Cancelar</button>' +
        '</div>';
    
    jQuery('body').append(modal);
    jQuery('body').append('<div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000;"></div>');
    
    // Handle follow-up button clicks
    jQuery('.schedule-follow-up-btn').on('click', function() {
        var days = jQuery(this).data('days');
        var followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + days);
        var dateString = followUpDate.toISOString().split('T')[0];
        
        // Update the date field directly
        var $dateField = $row.find('.deal-fecha2');
        $dateField.val(dateString);
        
        // Trigger change event to save via existing auto-save
        $dateField.trigger('change');
        
        // Close modal
        jQuery('.follow-up-modal, .modal-backdrop').remove();
        
        // Show success message with WhatsApp reminder option
        var successMsg = '✅ Seguimiento programado para ' + followUpDate.toLocaleDateString('es-CR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Add automatic reminder info
        successMsg += '\n\n🔔 Recibirás un recordatorio automático por WhatsApp.';
        
        alert(successMsg);
        
        // If it's for tomorrow, offer to send immediate reminder
        if(days === 1) {
            setTimeout(function() {
                if(confirm('¿Quieres recibir un recordatorio ahora mismo para confirmar que el sistema funciona?')) {
                    sendFollowUpTestMessage(clientName, followUpDate);
                }
            }, 1000);
        }
        
        // Reload page to update visual indicators
        setTimeout(function() {
            location.reload();
        }, 2000);
    });
    
    jQuery('.close-follow-up-modal, .modal-backdrop').on('click', function() {
        jQuery('.follow-up-modal, .modal-backdrop').remove();
    });
});

// Send test follow-up reminder
function sendFollowUpTestMessage(clientName, followUpDate) {
    var phone = '<?php echo get_user_meta(get_current_user_id(), "fave_agent_mobile", true); ?>';
    
    if(!phone) {
        alert('⚠️ No tienes WhatsApp configurado.\n\nUsa el botón "Configurar" en el panel de recordatorios.');
        return;
    }
    
    var cleanPhone = phone.replace(/[^0-9]/g, '');
    if(!cleanPhone.startsWith('506')) {
        cleanPhone = '506' + cleanPhone;
    }
    
    var message = "🔔 *RECORDATORIO DE SEGUIMIENTO*\n\n";
    message += "Cliente: " + clientName + "\n";
    message += "📅 Fecha programada: " + followUpDate.toLocaleDateString('es-CR') + "\n\n";
    message += "⏰ Este es un recordatorio de prueba.\n";
    message += "Recibirás el recordatorio real mañana a las 8:00 AM.\n\n";
    message += "✅ Sistema de recordatorios funcionando correctamente.";
    
    var whatsappUrl = 'https://api.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(message);
    window.open(whatsappUrl, '_blank');
}

// Priority change handler
jQuery(document).on('change', '.deal-priority', function() {
    var $select = jQuery(this);
    var dealId = $select.closest('tr').data('id');
    var priority = $select.val();
    
    jQuery.ajax({
        url: ajaxurl,
        type: 'POST',
        data: {
            action: 'houzez_update_deal_priority',
            deal_id: dealId,
            priority: priority,
            nonce: '<?php echo wp_create_nonce('update_priority'); ?>'
        },
        success: function(response) {
            if(response.success) {
                // Update visual indicator
                var $indicator = $select.siblings('.priority-indicator');
                $indicator.removeClass('priority-hot priority-warm priority-cold');
                $indicator.addClass('priority-' + priority);
            }
        }
    });
});
</script>

<style>
/* Modern stat cards */
.stat-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-card:hover {
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.stat-card.stat-urgent {
    border-left: 4px solid #e74c3c;
    background: #fff5f5;
}

.stat-card.stat-today {
    border-left: 4px solid #f39c12;
    background: #fffbf0;
}

.stat-icon {
    width: 60px;
    height: 60px;
    background: #f8f9fa;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    font-size: 28px;
    color: #666;
}

.stat-urgent .stat-icon {
    background: #fee;
    color: #e74c3c;
}

.stat-today .stat-icon {
    background: #fff3cd;
    color: #f39c12;
}

.stat-content h3 {
    font-size: 32px;
    margin: 0;
    font-weight: 700;
    color: #333;
}

.stat-label {
    color: #666;
    font-size: 14px;
    margin: 0;
}

/* WhatsApp card */
.whatsapp-card {
    background: #f8f9fa;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 20px;
    height: 100%;
}

.whatsapp-card h5 {
    font-size: 16px;
    margin-bottom: 15px;
    color: #333;
}

.btn-outline-primary {
    background: transparent;
    border: 1px solid #007bff;
    color: #007bff;
}

.btn-outline-primary:hover {
    background: #007bff;
    color: white;
}

/* Overdue deals styling */
tr.overdue-deal {
    background-color: #fee !important;
}

tr.today-deal {
    background-color: #fff3cd !important;
}

/* Priority indicators */
.priority-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 5px;
}

.priority-hot { background: #ff4444; }
.priority-warm { background: #ffaa00; }
.priority-cold { background: #00C851; }

/* WhatsApp quick actions */
.whatsapp-quick-action {
    background: #25D366;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.whatsapp-quick-action:hover {
    background: #128C7E;
    color: white;
}

/* Last contact indicator */
.last-contact {
    font-size: 11px;
    color: #666;
    display: block;
}

.last-contact.recent { color: #28a745; }
.last-contact.old { color: #dc3545; }

/* Action buttons */
.action-buttons {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
}

.mark-contacted {
    font-size: 12px;
    padding: 4px 8px;
}

/* Follow-up modal */
.follow-up-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 5px 30px rgba(0,0,0,0.3);
    z-index: 10001;
    text-align: center;
}

.follow-up-modal h4 {
    margin-bottom: 20px;
}

.follow-up-options {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    justify-content: center;
}

.follow-up-options button {
    min-width: 100px;
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
}

/* Bulk reminder button */
.reminder-widget.actions .btn {
    width: 100%;
}

/* Deals table improvements */
.deals-table input[type="text"],
.deals-table input[type="date"],
.deals-table textarea,
.deals-table select {
    width: 100%;
    min-width: 120px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 13px;
}

.deals-table textarea {
    min-height: 50px;
    resize: vertical;
}

.deals-table td {
    vertical-align: middle;
}

/* WhatsApp link styling */
.whatsapp-link {
    color: #25D366 !important;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.whatsapp-link:hover {
    color: #128C7E !important;
    text-decoration: underline;
}
</style>