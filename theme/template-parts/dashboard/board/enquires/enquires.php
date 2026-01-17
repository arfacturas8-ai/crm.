<?php
global $all_enquires;

$is_not_lead_detail = true;
if(isset($_GET['tab']) && $_GET['tab'] == 'enquires') {
    $is_not_lead_detail = false;
}

$colspan = 6;
if($is_not_lead_detail) {
    $colspan = 9;
} 

$dashboard_crm = houzez_get_template_link_2('template/user_dashboard_crm.php');

if(!empty($all_enquires['data']['results'])) {
?>
<table class="dashboard-table table-lined table-hover responsive-table">
    <thead>
        <tr>
            <th>
                <label class="control control--checkbox">
                    <input type="checkbox" class="enquiry_multi_delete" id="enquiry_select_all" name="enquiry_multicheck">
                    <span class="control__indicator"></span>
                </label>
            </th>
            <th><?php echo 'ID'; ?></th>

            <?php if($is_not_lead_detail) { ?>
            <th><?php echo 'Contacto'; ?></th>
            <th><?php echo 'Teléfono'; ?></th>
            <th><?php echo 'Correo'; ?></th>
            <th><?php echo 'Fuente'; ?></th>
            <?php } ?>

            <th><?php echo 'Tipo de Búsqueda'; ?></th>
            <th><?php echo 'Tipo de Propiedad'; ?></th>
            <th><?php echo 'Precio'; ?></th>
            <th><?php echo 'Habitaciones'; ?></th>

            <?php if($is_not_lead_detail) { ?>
            <th><?php echo 'Baños'; ?></th>
            <th><?php echo 'Área Construida'; ?></th>
            <?php } ?>

            <th></th>
        </tr>
    </thead>

    <tbody>
        
        <?php 
        foreach ($all_enquires['data']['results'] as $enquiry) { 

            $lead = Houzez_Leads::get_lead($enquiry->lead_id);
            $meta = maybe_unserialize($enquiry->enquiry_meta);

            $detail_enquiry = add_query_arg(
                array(
                    'hpage' => 'enquiries',
                    'enquiry' => $enquiry->enquiry_id,
                ), $dashboard_crm
            );

        ?>
        <tr>
            <td>
                <label class="control control--checkbox">
                    <input type="checkbox" class="enquiry_multi_delete" name="enquiry_multi_delete[]" value="<?php echo intval($enquiry->enquiry_id); ?>">
                    <span class="control__indicator"></span>
                </label>
            </td>
            <td data-label="<?php echo 'ID'; ?>">
                <?php echo esc_attr($enquiry->enquiry_id); ?>
            </td>

            <?php if($is_not_lead_detail) { ?>
            <td data-label="<?php echo 'Contacto'; ?>">
                <?php 
                if(isset($lead->display_name)) {
                    echo esc_attr($lead->display_name); 
                }?>
            </td>
            <td data-label="<?php echo 'Teléfono'; ?>">
                <?php if (!empty($lead->mobile)) : 
                    $clean_number = preg_replace('/[^0-9]/', '', $lead->mobile);
                    if (!preg_match('/^506/', $clean_number)) {
                        $clean_number = '506' . $clean_number;
                    }
                ?>
                    <a href="https://wa.me/<?php echo $clean_number; ?>" target="_blank" class="whatsapp-link">
                        <?php echo esc_attr($lead->mobile); ?>
                        <i class="houzez-icon icon-social-media-whatsapp" style="color: #25D366; margin-left: 5px;"></i>
                    </a>
                <?php else : ?>
                    -
                <?php endif; ?>
            </td>
            <td data-label="<?php echo 'Correo'; ?>">
                <?php if (!empty($lead->email)) : ?>
                    <a href="mailto:<?php echo esc_attr($lead->email); ?>">
                        <?php echo esc_attr($lead->email); ?>
                    </a>
                <?php else : ?>
                    -
                <?php endif; ?>
            </td>
            <td data-label="<?php echo 'Fuente'; ?>">
                <?php 
                if(isset($lead->type)) {
                    $sources = array(
                        'whatsapp' => 'WhatsApp',
                        'website' => 'Sitio web',
                        'facebook' => 'Facebook',
                        'instagram' => 'Instagram',
                        'marketplace' => 'Market Place',
                        'google' => 'Google',
                        'direct' => 'Directo',
                        'sign' => 'Rótulo'
                    );
                    echo isset($sources[$lead->type]) ? $sources[$lead->type] : $lead->type;
                } else {
                    echo '-';
                }
                ?>
            </td>
            <?php } ?>

            <td data-label="<?php echo 'Tipo de Búsqueda'; ?>">
                <?php echo esc_attr($enquiry->enquiry_type); ?>
            </td>
            <td data-label="<?php echo 'Tipo de Propiedad'; ?>">
                <?php 
                if(isset($meta['property_type']['name'])) {
                    echo esc_attr($meta['property_type']['name']); 
                }?>
            </td>

            <td data-label="<?php echo 'Precio'; ?>">
                <?php 
                if(isset($meta['min_price'])) {
                    echo esc_attr($meta['min_price']); 
                }

                if(isset($meta['max_price'])) {
                    echo ' - '.esc_attr($meta['max_price']); 
                }?>
            </td>

            <td data-label="<?php echo 'Habitaciones'; ?>">
                <?php 
                if(isset($meta['min_beds'])) {
                    echo esc_attr($meta['min_beds']); 
                }

                if(isset($meta['max_beds'])) {
                    echo ' - '.esc_attr($meta['max_beds']); 
                }?>
            </td>

            <?php if($is_not_lead_detail) { ?>
            <td data-label="<?php echo 'Baños'; ?>">
                <?php 
                if(isset($meta['min_baths'])) {
                    echo esc_attr($meta['min_baths']); 
                }

                if(isset($meta['max_baths'])) {
                    echo ' - '.esc_attr($meta['max_baths']); 
                }?>
            </td>

            <td data-label="<?php echo 'Área Construida'; ?>">
                <?php 
                if(isset($meta['min_area'])) {
                    echo esc_attr($meta['min_area']); 
                }

                if(isset($meta['max_area'])) {
                    echo ' - '.esc_attr($meta['max_area']); 
                }?>
            </td>
            <?php } ?>

            <td class="text-right">
                <div class="btn-group">
                    <a href="<?php echo esc_url($detail_enquiry); ?>" class="btn btn-sm btn-primary-outlined"><?php echo 'Ver'; ?></a>
                    <button type="button" class="btn btn-sm btn-success-outlined match-properties-btn" data-enquiry-id="<?php echo intval($enquiry->enquiry_id); ?>">
                        <?php echo 'Buscar Propiedades'; ?>
                    </button>
                </div>
            </td>
        </tr>
        <?php
        } ?>

    </tbody>
</table><!-- dashboard-table -->
<?php
} else { ?>
    <div class="dashboard-content-block">
        <?php echo "No hay búsquedas en este momento."; ?>
    </div><!-- dashboard-content-block -->
<?php } ?>