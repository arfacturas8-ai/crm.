<?php
global $all_enquires;
$hpage = isset($_GET['hpage']) ? sanitize_text_field($_GET['hpage']) : '';
$keyword = isset($_GET['keyword']) ? sanitize_text_field(trim($_GET['keyword'])) : '';
$all_enquires = Houzez_Enquiry::get_enquires();
?>
<header class="header-main-wrap dashboard-header-main-wrap">
    <div class="dashboard-header-wrap">
        <div class="d-flex align-items-center">
            <div class="dashboard-header-left flex-grow-1">
                <h1><?php echo 'Buscar'; ?></h1>         
            </div><!-- dashboard-header-left -->
            <div class="dashboard-header-right">
                <button class="btn btn-primary open-close-slide-panel"><?php echo 'Nueva Búsqueda'; ?></button>
            </div><!-- dashboard-header-right -->
        </div><!-- d-flex -->
    </div><!-- dashboard-header-wrap -->
</header><!-- .header-main-wrap -->
<section class="dashboard-content-wrap">
    <div class="dashboard-content-inner-wrap">
        <div class="dashboard-content-block-wrap">

            <div class="dashboard-tool-block">
                <div class="dashboard-tool-buttons-block">
                    <div class="dashboard-tool-button">
                        <button id="export-inquiries" class="btn btn-primary-outlined"><span class="btn-loader houzez-loader-js"></span><?php echo 'Exportar'; ?>
                        </button>
                    </div>
                    <div class="dashboard-tool-button">
                        <button id="enquiry_delete_multiple" class="btn btn-grey-outlined"><?php echo 'Eliminar'; ?></button>
                    </div>
                    <div class="dashboard-tool-button">
                        <div class="btn"><i class="houzez-icon icon-single-neutral-circle mr-2 grey"></i>
                            <?php echo esc_attr($all_enquires['data']['total_records']); ?> <?php echo 'Búsquedas encontradas'; ?>
                        </div>
                    </div>
                </div><!-- dashboard-tool-buttons-block -->
                
                <div class="dashboard-tool-search-block">
                    <div class="dashboard-crm-search-wrap">
                        <div class="d-flex">
                            <div class="flex-grow-1">
                                <div class="dashboard-crm-search">
                                    <form name="search-inquiries" method="get" action="<?php echo esc_url($_SERVER['REQUEST_URI']); ?>">
                                        <input type="hidden" name="hpage" value="<?php echo esc_attr($hpage); ?>">
                                    <div class="d-flex">
                                        <div class="form-group">
                                            <div class="search-icon">
                                                <input name="keyword" type="text" value="<?php echo esc_attr($keyword); ?>" class="form-control" placeholder="<?php echo 'Tipo de Búsqueda'; ?>">
                                            </div><!-- search-icon -->
                                        </div><!-- form-group -->
                                        <button type="submit" class="btn btn-search btn-secondary"><?php echo 'Buscar'; ?></button>
                                    </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div><!-- dashboard-crm-search-wrap -->
                </div><!-- dashboard-tool-search-block -->
                
            </div><!-- dashboard-tool-block -->
        
            <?php get_template_part('template-parts/dashboard/board/enquires/enquires'); ?>

        </div><!-- dashboard-content-block-wrap -->
    </div><!-- dashboard-content-inner-wrap -->

    <div class="leads-pagination-wrap">
        <div class="leads-pagination-item-count">
            <?php get_template_part('template-parts/dashboard/board/records-html'); ?>
        </div>

        <?php
        $total_pages = ceil($all_enquires['data']['total_records'] / $all_enquires['data']['items_per_page']);
        $current_page = $all_enquires['data']['page'];
        houzez_crm_pagination($total_pages, $current_page);
        ?>
    </div> <!-- leads-pagination-wrap -->

</section><!-- dashboard-content-wrap -->
<section class="dashboard-side-wrap">
    <?php get_template_part('template-parts/dashboard/side-wrap'); ?>
</section>

<?php get_template_part('template-parts/dashboard/board/enquires/add-new-enquiry'); ?>

<script>
jQuery(document).ready(function($) {
    // Export functionality for enquiries
    $('#export-inquiries').on('click', function() {
        var $btn = $(this);
        $btn.find('.btn-loader').addClass('loader-show');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_export_inquires',
                nonce: '<?php echo wp_create_nonce('export_inquires'); ?>'
            },
            success: function(response) {
                $btn.find('.btn-loader').removeClass('loader-show');
                if(response.success) {
                    window.location.href = response.data.file_url;
                }
            }
        });
    });
    
    // Delete multiple enquiries
    $('#enquiry_delete_multiple').on('click', function() {
        var selected = [];
        $('.enquiry_multi_delete:checked').each(function() {
            selected.push($(this).val());
        });
        
        if(selected.length === 0) {
            alert('Por favor seleccione al menos una búsqueda para eliminar');
            return;
        }
        
        if(confirm('¿Está seguro de que desea eliminar las búsquedas seleccionadas?')) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'houzez_delete_enquiries',
                    enquiry_ids: selected,
                    nonce: '<?php echo wp_create_nonce('delete_enquiries'); ?>'
                },
                success: function(response) {
                    location.reload();
                }
            });
        }
    });
    
    // Select all checkbox
    $('#enquiry_select_all').on('change', function() {
        $('.enquiry_multi_delete').prop('checked', $(this).is(':checked'));
    });
    
    // Property matching integration
    $('.match-properties-btn').on('click', function() {
        var enquiryId = $(this).data('enquiry-id');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_match_properties_for_enquiry',
                enquiry_id: enquiryId,
                nonce: '<?php echo wp_create_nonce('match_properties'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    // Show matched properties
                    var properties = response.data.properties;
                    var html = '<div class="matched-properties-list">';
                    
                    $.each(properties, function(i, property) {
                        html += '<div class="property-item">';
                        html += '<a href="' + property.url + '" target="_blank">' + property.title + '</a>';
                        html += '<span class="price">' + property.price + '</span>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    
                    // Display in modal or panel
                    $('#matched-properties-container').html(html);
                }
            }
        });
    });
});

// Integration with Houzez property search
function houzez_enquiry_property_integration() {
    // Connect enquiries with property search criteria
    jQuery(document).on('houzez_search_performed', function(e, search_criteria) {
        // Save search as enquiry
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'houzez_save_search_as_enquiry',
                criteria: search_criteria,
                lead_id: jQuery('#current_lead_id').val(),
                nonce: '<?php echo wp_create_nonce('save_search_enquiry'); ?>'
            }
        });
    });
}

jQuery(window).on('load', function() {
    houzez_enquiry_property_integration();
});

// Handle slide panel for new enquiry
jQuery(document).on('click', '.open-close-slide-panel', function(e) {
    e.preventDefault();
    jQuery('.dashboard-slide-panel-wrap').toggleClass('dashboard-slide-panel-on');
    jQuery('body').toggleClass('body-panel-overlay-on');
});

// Close slide panel
jQuery(document).on('click', '.open-close-enquiry-js', function(e) {
    e.preventDefault();
    jQuery('.dashboard-slide-panel-wrap').removeClass('dashboard-slide-panel-on');
    jQuery('body').removeClass('body-panel-overlay-on');
});
</script>

<style>
/* Fix scrolling issues */
.dashboard-content-wrap {
    overflow-y: auto !important;
    height: calc(100vh - 200px) !important;
    position: relative !important;
}

.dashboard-content-inner-wrap {
    padding-bottom: 50px !important;
}

/* Enquiries table improvements */
.dashboard-table {
    font-size: 14px;
    overflow-x: auto;
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

/* Matched properties styling */
.matched-properties-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 15px;
}

.property-item {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.property-item:hover {
    background-color: #f8f9fa;
}

.property-item .price {
    font-weight: 600;
    color: #2ecc71;
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