<?php
$dashboard_crm = houzez_get_template_link_2('template/user_dashboard_crm.php');
$import_link = add_query_arg( 'hpage', 'import-leads', $dashboard_crm );
$hpage = isset($_GET['hpage']) ? sanitize_text_field($_GET['hpage']) : '';
$keyword = isset($_GET['keyword']) ? sanitize_text_field(trim($_GET['keyword'])) : '';
$leads = Houzez_leads::get_leads();
?>
<header class="header-main-wrap dashboard-header-main-wrap">
    <div class="dashboard-header-wrap">
        <div class="d-flex align-items-center">
            <div class="dashboard-header-left flex-grow-1">
                <h1><?php echo 'Base de datos'; ?></h1>         
            </div><!-- dashboard-header-left -->
            <div class="dashboard-header-right">
                <a class="btn btn-primary open-close-slide-panel" href="#"><?php echo 'Agregar Nuevo'; ?></a>
            </div><!-- dashboard-header-right -->
        </div><!-- d-flex -->
    </div><!-- dashboard-header-wrap -->
</header><!-- .header-main-wrap -->
<section class="dashboard-content-wrap leads-main-wrap">
    <div class="dashboard-content-inner-wrap">
        
        <?php get_template_part('template-parts/dashboard/statistics/statistic-leads'); ?>

        <div class="dashboard-content-block-wrap">

            <div class="dashboard-tool-block">
                <div class="dashboard-tool-buttons-block">
                    <div class="dashboard-tool-button">
                        <button onclick="window.location.href='<?php echo esc_url($import_link);?>';" class="btn btn-primary-outlined"><?php echo 'Importar'; ?></button>
                    </div>
                    <div class="dashboard-tool-button">
                        <button id="export-leads" class="btn btn-primary-outlined"><span class="btn-loader houzez-loader-js"></span><?php echo 'Exportar'; ?>
                        </button>
                    </div>
                    <div class="dashboard-tool-button">
                        <button id="bulk-delete-leads" class="btn btn-grey-outlined"><?php echo 'Eliminar'; ?></button>
                    </div>
                    <div class="dashboard-tool-button">
                        <div class="btn"><i class="houzez-icon icon-single-neutral-circle mr-2 grey"></i>
                            <?php echo esc_attr($leads['data']['total_records']); ?> <?php echo 'Resultados Encontrados'; ?>
                        </div>
                    </div>
                </div><!-- dashboard-tool-buttons-block -->
                
                <div class="dashboard-tool-search-block">
                    <div class="dashboard-crm-search-wrap">
                        <div class="d-flex">
                            <div class="flex-grow-1">
                                <div class="dashboard-crm-search">
                                    <form name="search-leads" method="get" action="<?php echo esc_url($_SERVER['REQUEST_URI']); ?>">
                                        <input type="hidden" name="hpage" value="<?php echo esc_attr($hpage); ?>">
                                    <div class="d-flex">
                                        <div class="form-group">
                                            <div class="search-icon">
                                                <input name="keyword" type="text" value="<?php echo esc_attr($keyword); ?>" class="form-control" placeholder="<?php echo esc_html__('Search', 'houzez'); ?>">
                                            </div><!-- search-icon -->
                                        </div><!-- form-group -->
                                        <button type="submit" class="btn btn-search btn-secondary"><?php echo esc_html__( 'Search', 'houzez' ); ?></button>
                                    </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div><!-- dashboard-crm-search-wrap -->
                </div><!-- dashboard-tool-search-block -->
                
            </div><!-- dashboard-tool-block -->

            <?php
            $dashboard_crm = houzez_get_template_link_2('template/user_dashboard_crm.php');
        
            if(!empty($leads['data']['results'])) { ?>

                <table class="dashboard-table table-lined table-hover responsive-table">
                    <thead>
                        <tr>
                            <th>
                                <label class="control control--checkbox">
                                    <input type="checkbox" class="checkbox-delete" id="leads_select_all" name="leads_multicheck">
                                    <span class="control__indicator"></span>
                                </label>
                            </th>
                            <th><?php echo 'Nombre'; ?></th>
                            <th><?php echo 'Correo'; ?></th>
                            <th><?php echo 'Teléfono'; ?></th>
                            <th><?php echo 'Fuente'; ?></th>
                            <th><?php echo 'Fecha'; ?></th>
                            <th class="action-col"><?php echo 'Acciones'; ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        foreach ($leads['data']['results'] as $result) { 
                            $detail_link = add_query_arg(
                                array(
                                    'hpage' => 'lead-detail',
                                    'lead-id' => $result->lead_id,
                                    'tab' => 'enquires',
                                ), $dashboard_crm
                            );

                            $datetime = $result->time;

                            $datetime_unix = strtotime($datetime);
                            $get_date = houzez_return_formatted_date($datetime_unix);
                            $get_time = houzez_get_formatted_time($datetime_unix);
                        ?>

                            <tr>
                                <td>
                                    <label class="control control--checkbox">
                                        <input type="checkbox" class="checkbox-delete lead-bulk-delete" name="lead-bulk-delete[]" value="<?php echo intval($result->lead_id); ?>">
                                        <span class="control__indicator"></span>
                                    </label>
                                </td>
                                <td class="table-nowrap" data-label="<?php esc_html_e('Name', 'houzez'); ?>">
                                    <?php echo esc_attr($result->display_name); ?>
                                </td>
                                <td data-label="<?php esc_html_e('Email', 'houzez'); ?>">
                                    <a href="mailto:<?php echo esc_attr($result->email); ?>">
                                        <strong><?php echo esc_attr($result->email); ?></strong>
                                    </a>
                                </td>
                                <td data-label="<?php echo 'Teléfono'; ?>">
                                    <?php if (!empty($result->mobile)) : 
                                        $clean_number = preg_replace('/[^0-9]/', '', $result->mobile);
                                        if (!preg_match('/^506/', $clean_number)) {
                                            $clean_number = '506' . $clean_number;
                                        }
                                    ?>
                                        <a href="https://wa.me/<?php echo $clean_number; ?>" target="_blank" class="whatsapp-link">
                                            <?php echo esc_attr($result->mobile); ?>
                                            <i class="houzez-icon icon-social-media-whatsapp" style="color: #25D366; margin-left: 5px;"></i>
                                        </a>
                                    <?php else : ?>
                                        -
                                    <?php endif; ?>
                                </td>
                                <td data-label="<?php esc_html_e('Type', 'houzez'); ?>">
                                    <?php 
                                    if( $result->type ) {
                                        $type = stripslashes($result->type);
                                        $type = htmlentities($type);
                                        echo esc_attr($type); 
                                    }?>
                                </td>
                                <td class="table-nowrap" data-label="<?php esc_html_e('Date', 'houzez'); ?>">
                                    <?php echo esc_attr($get_date); ?><br>
                                    <?php echo esc_html__('at', 'houzez'); ?> <?php echo esc_attr($get_time); ?>
                                </td>
                                <td>
                                    <div class="dropdown property-action-menu">
                                        <button class="btn btn-primary-outlined dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <?php echo 'Acciones'; ?>
                                        </button>
                                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                                            <a class="dropdown-item" href="<?php echo esc_url($detail_link); ?>"><?php echo 'Detalles'; ?></a>

                                            <a class="edit-lead dropdown-item open-close-slide-panel" data-id="<?php echo intval($result->lead_id)?>" href="#"><?php echo 'Editar'; ?></a>

                                            <a href="" class="delete-lead dropdown-item" data-id="<?php echo intval($result->lead_id); ?>" data-nonce="<?php echo wp_create_nonce('delete_lead_nonce') ?>"><?php echo 'Eliminar'; ?></a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        <?php
                        } ?>
                    </tbody>
                </table>
            <?php
            } else { ?>
                <div class="dashboard-content-block">

                    <?php if( $keyword ) { 
                        esc_html_e("No Result Found", 'houzez');
                    } else { ?>
                    <?php esc_html_e("You don't have any contact at this moment.", 'houzez'); ?> <a class="open-close-slide-panel" href="#"><strong><?php esc_html_e('Add New', 'houzez'); ?></strong></a>
                    <?php } ?>
                </div><!-- dashboard-content-block -->
            <?php } ?>
        

        </div><!-- dashboard-content-block-wrap -->
    </div><!-- dashboard-content-inner-wrap -->

    <div class="leads-pagination-wrap">
        <div class="leads-pagination-item-count">
            <?php get_template_part('template-parts/dashboard/board/records-html'); ?>
        </div>

        <?php
        $total_pages = ceil($leads['data']['total_records'] / $leads['data']['items_per_page']);
        $current_page = $leads['data']['page'];
        houzez_crm_pagination($total_pages, $current_page);
        ?>

    </div> <!-- leads-pagination-wrap -->

</section><!-- dashboard-content-wrap -->
<section class="dashboard-side-wrap">
    <?php get_template_part('template-parts/dashboard/side-wrap'); ?>
</section>

<script>
jQuery(document).ready(function($) {
    // Export functionality
    $('#export-leads').on('click', function() {
        var $btn = $(this);
        $btn.find('.btn-loader').addClass('loader-show');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_export_leads',
                nonce: '<?php echo wp_create_nonce('export_leads'); ?>'
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
    $('#bulk-delete-leads').on('click', function() {
        var selected = [];
        $('.lead-bulk-delete:checked').each(function() {
            selected.push($(this).val());
        });
        
        if(selected.length === 0) {
            alert('Por favor seleccione al menos un contacto para eliminar');
            return;
        }
        
        if(confirm('¿Está seguro de que desea eliminar los contactos seleccionados?')) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'houzez_delete_leads_bulk',
                    lead_ids: selected,
                    nonce: '<?php echo wp_create_nonce('delete_leads_bulk'); ?>'
                },
                success: function(response) {
                    location.reload();
                }
            });
        }
    });
    
    // Select all checkbox
    $('#leads_select_all').on('change', function() {
        $('.lead-bulk-delete').prop('checked', $(this).is(':checked'));
    });
    
    // Delete single lead
    $('.delete-lead').on('click', function(e) {
        e.preventDefault();
        var leadId = $(this).data('id');
        var nonce = $(this).data('nonce');
        
        if(confirm('¿Está seguro de que desea eliminar este contacto?')) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'houzez_delete_lead',
                    lead_id: leadId,
                    security: nonce
                },
                success: function(response) {
                    location.reload();
                }
            });
        }
    });
    
    // Edit lead inline
    $('.edit-lead').on('click', function(e) {
        e.preventDefault();
        var leadId = $(this).data('id');
        
        // Use existing Houzez slide panel if available
        if(typeof houzezOpenSlidePanel === 'function') {
            houzezOpenSlidePanel();
        }
        
        // Load lead data for editing
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_get_lead_data',
                lead_id: leadId,
                nonce: '<?php echo wp_create_nonce('get_lead_data'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    // Populate form fields with lead data
                    var data = response.data;
                    $('#lead_id').val(data.lead_id);
                    $('#display_name').val(data.display_name);
                    $('#email').val(data.email);
                    $('#mobile').val(data.mobile);
                    $('#lead_type').val(data.type);
                    
                    // Update source dropdown to show correct options
                    var sourceSelect = $('#lead_type');
                    sourceSelect.empty();
                    var sources = {
                        'whatsapp': 'WhatsApp',
                        'website': 'Sitio web',
                        'facebook': 'Facebook',
                        'instagram': 'Instagram',
                        'marketplace': 'Market Place',
                        'google': 'Google',
                        'direct': 'Directo',
                        'sign': 'Rótulo'
                    };
                    
                    $.each(sources, function(value, label) {
                        sourceSelect.append($('<option></option>').attr('value', value).text(label));
                    });
                    
                    sourceSelect.val(data.type);
                }
            }
        });
    });
});

// Integration with Houzez CRM system
function houzez_crm_integration() {
    // Connect with Houzez lead management
    if(typeof Houzez_crm !== 'undefined') {
        Houzez_crm.init_lead_connections();
    }
    
    // Connect with property system
    jQuery(document).on('houzez_property_selected', function(e, property_id) {
        // Link property to lead/deal
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_link_property_to_lead',
                property_id: property_id,
                lead_id: jQuery('#current_lead_id').val(),
                nonce: '<?php echo wp_create_nonce('link_property'); ?>'
            }
        });
    });
}

// Initialize on page load
jQuery(window).on('load', function() {
    houzez_crm_integration();
});
</script>

<style>
/* Leads table improvements */
.dashboard-table {
    font-size: 14px;
}

.dashboard-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #333;
}

.dashboard-table td {
    vertical-align: middle;
    padding: 10px;
}

/* WhatsApp link styling */
.whatsapp-link {
    color: inherit !important;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.whatsapp-link:hover {
    color: #25D366 !important;
}

/* Make source field look editable */
.lead-source {
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
}

.lead-source:hover {
    background-color: #f0f0f0;
}

/* Responsive improvements */
@media (max-width: 768px) {
    .dashboard-table td {
        display: block;
        text-align: right;
        padding-left: 50%;
        position: relative;
    }
    
    .dashboard-table td:before {
        content: attr(data-label);
        position: absolute;
        left: 10px;
        width: 45%;
        text-align: left;
        font-weight: 600;
    }
}
</style>