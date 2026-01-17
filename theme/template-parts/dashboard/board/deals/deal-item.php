<?php
global $deal_data;

// Preparar fechas
$action_due_date = str_replace('00:00:00', '', $deal_data->action_due_date);
if($action_due_date == '0000-00-00 ') { $action_due_date = ""; }

$last_contact_date = str_replace('00:00:00', '', $deal_data->last_contact_date);
if($last_contact_date == '0000-00-00 ') { $last_contact_date = ""; }

$deal_id    = $deal_data->deal_id;
$title      = $deal_data->title;
$agent_id   = $deal_data->agent_id;
$agent_name = get_the_title($agent_id);

$lead = Houzez_Leads::get_lead($deal_data->lead_id);
$display_name = $lead_mobile = $lead_email = '';
if( ! empty($lead) ) {
    $display_name = $lead->display_name ?: ($lead->first_name.' '.$lead->last_name);
    $lead_mobile  = $lead->mobile;
    $lead_email   = $lead->email;
}

// Check if deal is overdue or due today
$today = date('Y-m-d');
$fecha_seguimiento = get_post_meta($deal_id, 'deal_fecha2', true);
$row_class = '';
if($fecha_seguimiento) {
    if($fecha_seguimiento < $today) {
        $row_class = 'overdue-deal';
    } elseif($fecha_seguimiento == $today) {
        $row_class = 'today-deal';
    }
}

// Calculate days since last contact
$fecha_contacto = get_post_meta($deal_id, 'deal_fecha1', true);
$days_since_contact = '';
if($fecha_contacto) {
    $diff = date_diff(date_create($fecha_contacto), date_create($today));
    $days_since_contact = $diff->days;
}

// Campos originales
$status         = $deal_data->status;      // "active", "won", "lost"
$next_action    = $deal_data->next_action; 
$deal_value     = $deal_data->deal_value;

// NUEVOS CAMPOS DE SEGUIMIENTO
// Se asume que se guardan en post_meta o similar
$busca             = get_post_meta($deal_id, 'deal_busca', true);
$propiedad         = get_post_meta($deal_id, 'deal_propiedad', true);
$estado_contacto   = get_post_meta($deal_id, 'deal_estado', true);
$detalles_1        = get_post_meta($deal_id, 'deal_detalles', true);
$fecha_1           = get_post_meta($deal_id, 'deal_fecha1', true);
$seguimiento_veces = get_post_meta($deal_id, 'deal_seguimiento', true);
$fecha_2           = get_post_meta($deal_id, 'deal_fecha2', true);
$detalles_2        = get_post_meta($deal_id, 'deal_detalles2', true);
$visita_confirmada = get_post_meta($deal_id, 'deal_visita_confirmada', true);
$calificacion      = get_post_meta($deal_id, 'deal_calificacion', true);
$proximo_paso      = get_post_meta($deal_id, 'deal_proximo_paso', true);

?>
<tr data-id="<?php echo intval($deal_id); ?>" class="<?php echo $row_class; ?>">
    <!-- Checkbox -->
    <td>
        <label class="control control--checkbox">
            <input type="checkbox" class="deal-bulk-delete" name="deal_bulk_delete[]" value="<?php echo intval($deal_id); ?>">
            <span class="control__indicator"></span>
        </label>
    </td>

    <!-- Nombre de Contacto -->
    <td data-label="<?php echo 'Nombre de Contacto'; ?>">
        <?php echo esc_attr($display_name); ?>
        <?php if($days_since_contact !== '') : ?>
            <span class="last-contact <?php echo ($days_since_contact > 7) ? 'old' : 'recent'; ?>">
                <?php echo ($days_since_contact == 0) ? 'Hoy' : 'Hace ' . $days_since_contact . ' días'; ?>
            </span>
        <?php endif; ?>
    </td>

    <!-- Busca (Comprar, Alquilar, Vender) -->
    <td data-label="<?php echo 'Busca'; ?>">
        <select class="form-control deal-busca" name="deal_busca_<?php echo intval($deal_id); ?>">
            <option value="">Seleccionar</option>
            <option value="comprar"  <?php selected($busca, 'comprar'); ?>>Comprar</option>
            <option value="alquilar" <?php selected($busca, 'alquilar'); ?>>Alquilar</option>
            <option value="vender"   <?php selected($busca, 'vender'); ?>>Vender</option>
        </select>
    </td>

    <!-- Propiedad -->
    <td data-label="<?php echo 'Propiedad'; ?>">
        <input type="text" class="form-control deal-propiedad" name="deal_propiedad_<?php echo intval($deal_id); ?>"
               value="<?php echo esc_attr($propiedad); ?>" 
               placeholder="Escribe o vincula">
    </td>

    <!-- Estado (Contactado / No contactado) -->
    <td data-label="<?php echo 'Estado'; ?>">
        <select class="form-control deal-estado" name="deal_estado_<?php echo intval($deal_id); ?>">
            <option value="">Seleccionar</option>
            <option value="contactado"    <?php selected($estado_contacto, 'contactado'); ?>>Contactado</option>
            <option value="no_contactado" <?php selected($estado_contacto, 'no_contactado'); ?>>No contactado</option>
        </select>
    </td>

    <!-- Detalles 1 -->
    <td data-label="<?php echo 'Detalles Contacto'; ?>">
        <textarea class="form-control deal-detalles" name="deal_detalles_<?php echo intval($deal_id); ?>" 
                  rows="2" placeholder="Escribe detalles"><?php echo esc_textarea($detalles_1); ?></textarea>
    </td>

    <!-- Fecha 1 -->
    <td data-label="<?php echo 'Fecha Contacto'; ?>">
        <input type="date" class="form-control deal-fecha1" name="deal_fecha1_<?php echo intval($deal_id); ?>"
               value="<?php echo esc_attr($fecha_1); ?>">
    </td>

    <!-- Seguimiento (Una vez, Dos veces, Tres veces) -->
    <td data-label="<?php echo 'Seguimiento'; ?>">
        <select class="form-control deal-seguimiento" name="deal_seguimiento_<?php echo intval($deal_id); ?>">
            <option value="">Seleccionar</option>
            <option value="una"  <?php selected($seguimiento_veces, 'una'); ?>>Una vez</option>
            <option value="dos"  <?php selected($seguimiento_veces, 'dos'); ?>>Dos veces</option>
            <option value="tres" <?php selected($seguimiento_veces, 'tres'); ?>>Tres veces</option>
        </select>
    </td>

    <!-- Fecha Seguimiento -->
    <td data-label="<?php echo 'Fecha Seguimiento'; ?>">
        <input type="date" class="form-control deal-fecha2" name="deal_fecha2_<?php echo intval($deal_id); ?>"
               value="<?php echo esc_attr($fecha_2); ?>">
    </td>

    <!-- Detalles Seguimiento -->
    <td data-label="<?php echo 'Detalles Seguimiento'; ?>">
        <textarea class="form-control deal-detalles2" name="deal_detalles2_<?php echo intval($deal_id); ?>"
                  rows="2" placeholder="Escribe detalles"><?php echo esc_textarea($detalles_2); ?></textarea>
    </td>

    <!-- Visita confirmada -->
    <td data-label="<?php echo 'Visita confirmada'; ?>">
        <input type="date" class="form-control deal-visita" name="deal_visita_confirmada_<?php echo intval($deal_id); ?>"
               value="<?php echo esc_attr($visita_confirmada); ?>">
    </td>

    <!-- Calificación cliente -->
    <td data-label="<?php echo 'Calificación cliente'; ?>">
        <select class="form-control deal-calificacion" name="deal_calificacion_<?php echo intval($deal_id); ?>">
            <option value="">Seleccionar</option>
            <option value="potencial"        <?php selected($calificacion, 'potencial'); ?>>Potencial</option>
            <option value="mas_seguimiento"  <?php selected($calificacion, 'mas_seguimiento'); ?>>Más seguimiento</option>
            <option value="no_potencial"     <?php selected($calificacion, 'no_potencial'); ?>>No potencial</option>
        </select>
    </td>

    <!-- Próximo paso -->
    <td data-label="<?php echo 'Próximo paso'; ?>">
        <select class="form-control deal-proximo-paso" name="deal_proximo_paso_<?php echo intval($deal_id); ?>">
            <option value="">Seleccionar</option>
            <option value="mas_opciones"   <?php selected($proximo_paso, 'mas_opciones'); ?>>Más opciones</option>
            <option value="opcion_compra"  <?php selected($proximo_paso, 'opcion_compra'); ?>>Opción de compra</option>
            <option value="financiamiento" <?php selected($proximo_paso, 'financiamiento'); ?>>Financiamiento</option>
            <option value="compro"         <?php selected($proximo_paso, 'compro'); ?>>Compró</option>
            <option value="alquilo"        <?php selected($proximo_paso, 'alquilo'); ?>>Alquiló</option>
        </select>
    </td>

    <!-- Teléfono -->
    <td data-label="<?php echo 'Teléfono'; ?>">
        <?php if (!empty($lead_mobile)) : 
            $clean_number = preg_replace('/[^0-9]/', '', $lead_mobile);
            if (!preg_match('/^506/', $clean_number)) {
                $clean_number = '506' . $clean_number;
            }
        ?>
            <a href="https://wa.me/<?php echo $clean_number; ?>" target="_blank" class="whatsapp-link">
                <strong class="deal-phone"><?php echo esc_attr($lead_mobile); ?></strong>
                <i class="houzez-icon icon-social-media-whatsapp" style="color: #25D366; margin-left: 5px;"></i>
            </a>
        <?php else : ?>
            <strong class="deal-phone">-</strong>
        <?php endif; ?>
    </td>

    <!-- Correo -->
    <td data-label="<?php echo 'Correo'; ?>">
        <a href="mailto:<?php echo esc_attr($lead_email); ?>">
            <strong><?php echo esc_attr($lead_email); ?></strong>
        </a>
    </td>

    <!-- Acciones -->
    <td>
        <div class="action-buttons">
            <?php if (!empty($lead_mobile)) : 
                $clean_number = preg_replace('/[^0-9]/', '', $lead_mobile);
                if (!preg_match('/^506/', $clean_number)) {
                    $clean_number = '506' . $clean_number;
                }
            ?>
                <button class="whatsapp-quick-action" onclick="sendWhatsAppToClient('<?php echo $clean_number; ?>', '<?php echo esc_attr($display_name); ?>', '<?php echo intval($deal_id); ?>')">
                    <i class="houzez-icon icon-social-media-whatsapp"></i> Recordar
                </button>
            <?php endif; ?>
            
            <div class="dropdown property-action-menu" style="display: inline-block;">
                <button class="btn btn-primary-outlined dropdown-toggle btn-sm" type="button" 
                        id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Más
                </button>
                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                    <a class="crm-edit-deal-js dropdown-item open-close-slide-panel" data-id="<?php echo intval($deal_id); ?>" href="#">
                        Editar
                    </a>
                    <a class="dropdown-item add-note" data-deal-id="<?php echo intval($deal_id); ?>" href="#">
                        Agregar Nota
                    </a>
                    <a class="dropdown-item schedule-follow-up" data-deal-id="<?php echo intval($deal_id); ?>" href="#">
                        Programar Seguimiento
                    </a>
                    <a class="delete-deal-js dropdown-item" 
                       data-id="<?php echo intval($deal_id); ?>" 
                       data-nonce="<?php echo wp_create_nonce('delete_deal_nonce'); ?>" href="#">
                        Borrar
                    </a>
                </div>
            </div>
        </div>
    </td>
</tr>