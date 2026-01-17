<?php
/**
 * Sub-template: Muestra la información detallada de un lead.
 */
global $lead;

// Verificamos si $lead está disponible:
if( ! empty($lead) ) :
?>
<div class="lead-detail-wrap">
    <h2><?php esc_html_e('Información del Contacto', 'houzez'); ?></h2>

    <!-- Botón para editar, que abre el panel flotante (igual que en “enquiry-info.php”) -->
    <a class="edit_lead_js label primary-label edit-lead-detail open-close-slide-panel"
       href="#"
       data-id="<?php echo intval($lead->lead_id); ?>"
    >
        <?php esc_html_e('Editar', 'houzez'); ?>
    </a>

    <ul class="list-unstyled mb-5">
        <li>
            <strong><?php esc_html_e('Nombre Completo', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->display_name); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Correo Electrónico', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->email); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Celular', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->mobile); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Teléfono de Casa', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->home_phone); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Teléfono de Trabajo', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->work_phone); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Tipo de Usuario', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->type); // Ejemplo: “comprador”, “agente”, etc. ?>
        </li>
        <li>
            <strong><?php esc_html_e('Dirección', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->address); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Ciudad', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->city); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Estado/Provincia', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->state); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Código Postal', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->zip); ?>
        </li>
        <li>
            <strong><?php esc_html_e('País', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->country); ?>
        </li>
        <li>
            <strong><?php esc_html_e('Fuente', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->source); // Ej: “Sitio Web”, “Facebook”, etc. ?>
        </li>
        <li>
            <strong><?php esc_html_e('Nota Privada', 'houzez'); ?>: </strong><br>
            <?php echo esc_attr($lead->private_note); ?>
        </li>
    </ul>
</div><!-- lead-detail-wrap -->
<?php endif; ?>