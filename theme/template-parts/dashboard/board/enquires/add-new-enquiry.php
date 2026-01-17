<div class="dashboard-slide-panel-wrap enquiry-panel-js">
    <h2><?php esc_html_e('Agregar Nueva Búsqueda', 'houzez'); ?></h2>
    <button type="button" class="btn open-close-slide-panel open-close-enquiry-js">
        <span aria-hidden="true">&times;</span>
    </button>
    <form id="enquiry-form">
        <div class="lined-block">
            <div class="row">
                <div class="col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Contacto*'; ?></label>
                        <select name="lead_id" id="lead_id" class="selectpicker form-control bs-select-hidden" data-live-search="true">
                            <option value=""><?php echo 'Seleccionar'; ?></option>
                            <?php
                            $contacts = Houzez_Leads::get_all_leads();
                            foreach ($contacts as $contact) {
                                if( $contact->lead_id != '' ) {
                                    echo '<option value="'.esc_attr($contact->lead_id).'">'.esc_attr($contact->display_name).'</option>';
                                }
                            }
                            ?>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="lined-block">
            <h3><?php esc_html_e('Información', 'houzez'); ?></h3>
            <div class="row">
                <div class="col-md-12 col-sm-12">
                    <div class="form-group">
                        <label><?php esc_html_e('Tipo de Búsqueda*', 'houzez'); ?></label>
                        <select id="enquiry_type" name="enquiry_type" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="false">
                            <option value=""><?php esc_html_e('Seleccionar', 'houzez'); ?></option>
                            <?php
                            $enquiry_type = hcrm_get_option(
                                'enquiry_type', 
                                'hcrm_enquiry_settings', 
                                esc_html__('Compra, Renta, Venta, Omitir, Evaluación, Hipoteca', 'houzez')
                            );
                            if(!empty($enquiry_type)) {
                                $enquiry_type = explode(',', $enquiry_type);
                                foreach( $enquiry_type as $en_type ) {
                                    echo '<option value="'.trim($en_type).'">'.esc_attr($en_type).'</option>';
                                }
                            }
                            ?>
                        </select><!-- selectpicker -->
                    </div><!-- form-group -->
                </div><!-- col-md-6 col-sm-12 -->
                
                <div class="col-md-12 col-sm-12">
                    <div class="form-group">
                        <label><?php esc_html_e('Tipo de Propiedad*', 'houzez'); ?></label>
                        <select id="property_type" name="e_meta[property_type]" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="true">
                            <?php
                            echo '<option value="">'.esc_html__('Seleccionar', 'houzez').'</option>';
                            $prop_type = get_terms(
                                array("property_type"),
                                array(
                                    'orderby' => 'name',
                                    'order' => 'ASC',
                                    'hide_empty' => false,
                                    'parent' => 0
                                )
                            );
                            hcrm_get_taxonomy('property_type', $prop_type);
                            ?>
                        </select><!-- selectpicker -->
                    </div>
                </div><!-- col-md-6 col-sm-12 -->

                <div class="col-md-12 col-sm-12">
                    <div class="form-group">
                        <label><?php esc_html_e('Estatus de la Propiedad', 'houzez'); ?></label>
                        <select id="property_status" name="e_meta[property_status]" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="true">
                            <?php
                            echo '<option value="">'.esc_html__('Seleccionar', 'houzez').'</option>';
                            $prop_status = get_terms(
                                array("property_status"),
                                array(
                                    'orderby' => 'name',
                                    'order' => 'ASC',
                                    'hide_empty' => false,
                                    'parent' => 0
                                )
                            );
                            hcrm_get_taxonomy('property_status', $prop_status);
                            ?>
                        </select><!-- selectpicker -->
                    </div>
                </div><!-- col-md-6 col-sm-12 -->

                <div class="col-md-12 col-sm-12">
                    <div class="form-group">
                        <label><?php esc_html_e('Etiqueta de la Propiedad', 'houzez'); ?></label>
                        <select id="property_label" name="e_meta[property_label]" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="true">
                            <?php
                            echo '<option value="">'.esc_html__('Seleccionar', 'houzez').'</option>';
                            $prop_label = get_terms(
                                array("property_label"),
                                array(
                                    'orderby' => 'name',
                                    'order' => 'ASC',
                                    'hide_empty' => false,
                                    'parent' => 0
                                )
                            );
                            hcrm_get_taxonomy('property_label', $prop_label);
                            ?>
                        </select><!-- selectpicker -->
                    </div>
                </div><!-- col-md-6 col-sm-12 -->
            </div><!-- row -->
            
            <div class="row">
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Precio Mínimo'; ?></label>
                        <input type="number" name="e_meta[min_price]" class="form-control" placeholder="0">
                    </div>
                </div>
                
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Precio Máximo'; ?></label>
                        <input type="number" name="e_meta[max_price]" class="form-control" placeholder="0">
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Habitaciones Mínimas'; ?></label>
                        <input type="number" name="e_meta[min_beds]" class="form-control" placeholder="0">
                    </div>
                </div>
                
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Habitaciones Máximas'; ?></label>
                        <input type="number" name="e_meta[max_beds]" class="form-control" placeholder="0">
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Baños Mínimos'; ?></label>
                        <input type="number" name="e_meta[min_baths]" class="form-control" placeholder="0">
                    </div>
                </div>
                
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Baños Máximos'; ?></label>
                        <input type="number" name="e_meta[max_baths]" class="form-control" placeholder="0">
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Área Mínima'; ?></label>
                        <input type="number" name="e_meta[min_area]" class="form-control" placeholder="0">
                    </div>
                </div>
                
                <div class="col-md-6 col-sm-12">
                    <div class="form-group">
                        <label><?php echo 'Área Máxima'; ?></label>
                        <input type="number" name="e_meta[max_area]" class="form-control" placeholder="0">
                    </div>
                </div>
            </div>
            
        </div><!-- lined-block -->
        
        <button type="submit" class="btn btn-primary btn-full-width">
            <?php echo 'Guardar Búsqueda'; ?>
        </button>
        
        <input type="hidden" name="action" value="houzez_crm_add_enquiry">
        <?php wp_nonce_field('houzez_crm_add_enquiry'); ?>
        
    </form>
</div><!-- dashboard-slide-panel-wrap -->