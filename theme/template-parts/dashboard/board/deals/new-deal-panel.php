<?php 
global $deal_settings; 
$agency_id = get_user_meta(get_current_user_id(), 'fave_author_agency_id', true);
?>
<div class="dashboard-slide-panel-wrap deal-panel-wrap-js">
	<form id="deal-form">
		<h2><?php esc_html_e('Agregar Nuevo Seguimiento', 'houzez'); ?></h2>
		<button type="button" class="btn open-close-slide-panel">
			<span aria-hidden="true">&times;</span>
		</button>
		
		<div class="form-group">
			<label><?php esc_html_e('Grupo', 'houzez'); ?></label>
			<select name="deal_group" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="false">
				<option value="active"><?php esc_html_e('Amarillo: Dar seguimiento', 'houzez'); ?></option>
				<option value="won"><?php esc_html_e('Verde: Cliente potencial', 'houzez'); ?></option>
				<option value="lost"><?php esc_html_e('Rojo: Descartado', 'houzez'); ?></option>
			</select>
		</div>

		<div class="form-group">
			<label><?php esc_html_e('Título', 'houzez'); ?></label>
			<input class="form-control" name="deal_title" placeholder="<?php esc_html_e('Ingresa el título del seguimiento', 'houzez'); ?>" type="text">
		</div>

		<div class="form-group">
			<label><?php esc_html_e('Nombre de Contacto', 'houzez'); ?></label>
			<select name="deal_contact" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="true">
				<option value=""><?php esc_html_e('Seleccionar', 'houzez'); ?></option>
				<?php 
				$all_leads = Houzez_leads::get_all_leads();
				foreach ($all_leads as $lead) {
					echo '<option value="'.intval($lead->lead_id).'">'.$lead->display_name.'</option>';
				}
				?>
			</select>
		</div>

		<?php if( houzez_is_admin() ) { ?>
		<div class="form-group">
			<label><?php esc_html_e('Agente', 'houzez'); ?></label>
			<select name="deal_agent" class="selectpicker form-control bs-select-hidden" title="<?php esc_html_e('Seleccionar', 'houzez'); ?>" data-live-search="true">
				<option value=""><?php esc_html_e('Seleccionar', 'houzez'); ?></option>
				<?php 
				$args = array(
					'post_type' => 'houzez_agent',
					'posts_per_page' => -1,
					'post_status' => 'publish'
				);
				$agent_qry = new WP_Query($args);
				if($agent_qry->have_posts()):
					while ($agent_qry->have_posts()):
						$agent_qry->the_post();
						if ( houzez_is_agency() ) {
							if( $agency_id == get_post_meta(get_the_ID(), 'fave_agent_agencies', true) ) {
								echo '<option value="'.get_the_ID().'">'.get_the_title().'</option>';
							}
						} else {
							echo '<option value="'.get_the_ID().'">'.get_the_title().'</option>';
						}
					endwhile;
				endif; 
				wp_reset_postdata();
				?>
			</select>
		</div>
		<?php } ?>

		<div class="form-group">
			<label><?php esc_html_e('Valor del Seguimiento', 'houzez'); ?></label>
			<input class="form-control" name="deal_value" placeholder="<?php esc_html_e('Ingresa el valor del seguimiento', 'houzez'); ?>" type="text">
		</div>

		<!-- Nuevos campos personalizados -->
		<div class="form-group">
			<label><?php echo 'Busca'; ?></label>
			<select name="deal_busca" class="selectpicker form-control bs-select-hidden" title="<?php echo 'Seleccionar'; ?>">
				<option value="">Seleccionar</option>
				<option value="comprar">Comprar</option>
				<option value="alquilar">Alquilar</option>
				<option value="vender">Vender</option>
			</select>
		</div>

		<div class="form-group">
			<label><?php echo 'Propiedad'; ?></label>
			<input class="form-control" name="deal_propiedad" placeholder="<?php echo 'Escribe o vincula propiedad'; ?>" type="text">
		</div>

		<div class="form-group">
			<label><?php echo 'Estado'; ?></label>
			<select name="deal_estado" class="selectpicker form-control bs-select-hidden" title="<?php echo 'Seleccionar'; ?>">
				<option value="">Seleccionar</option>
				<option value="contactado">Contactado</option>
				<option value="no_contactado">No contactado</option>
			</select>
		</div>

		<div class="form-group">
			<label><?php echo 'Detalles'; ?></label>
			<textarea class="form-control" name="deal_detalles" rows="3" placeholder="<?php echo 'Escribe detalles'; ?>"></textarea>
		</div>

		<div class="form-group">
			<label><?php echo 'Fecha'; ?></label>
			<input class="form-control" name="deal_fecha1" type="date">
		</div>

		<div class="form-group">
			<label><?php echo 'Seguimiento'; ?></label>
			<select name="deal_seguimiento" class="selectpicker form-control bs-select-hidden" title="<?php echo 'Seleccionar'; ?>">
				<option value="">Seleccionar</option>
				<option value="una">Una vez</option>
				<option value="dos">Dos veces</option>
				<option value="tres">Tres veces</option>
			</select>
		</div>

		<div class="form-group">
			<label><?php echo 'Fecha Seguimiento'; ?></label>
			<input class="form-control" name="deal_fecha2" type="date">
		</div>

		<div class="form-group">
			<label><?php echo 'Detalles Seguimiento'; ?></label>
			<textarea class="form-control" name="deal_detalles2" rows="3" placeholder="<?php echo 'Escribe detalles'; ?>"></textarea>
		</div>

		<div class="form-group">
			<label><?php echo 'Visita confirmada'; ?></label>
			<input class="form-control" name="deal_visita_confirmada" type="date">
		</div>

		<div class="form-group">
			<label><?php echo 'Calificación cliente'; ?></label>
			<select name="deal_calificacion" class="selectpicker form-control bs-select-hidden" title="<?php echo 'Seleccionar'; ?>">
				<option value="">Seleccionar</option>
				<option value="potencial">Potencial</option>
				<option value="mas_seguimiento">Más seguimiento</option>
				<option value="no_potencial">No potencial</option>
			</select>
		</div>

		<div class="form-group">
			<label><?php echo 'Próximo paso'; ?></label>
			<select name="deal_proximo_paso" class="selectpicker form-control bs-select-hidden" title="<?php echo 'Seleccionar'; ?>">
				<option value="">Seleccionar</option>
				<option value="mas_opciones">Más opciones</option>
				<option value="opcion_compra">Opción de compra</option>
				<option value="financiamiento">Financiamiento</option>
				<option value="compro">Compró</option>
				<option value="alquilo">Alquiló</option>
			</select>
		</div>

		<button id="add_deal" type="button" class="btn btn-primary btn-full-width mt-2">
			<?php get_template_part('template-parts/loader'); ?>
			<?php esc_html_e('Guardar', 'houzez'); ?>
		</button>
		<?php get_template_part('template-parts/overlay-loader'); ?>
		<input type="hidden" name="action" value="houzez_crm_add_deal">
		<br/>
		<div id="deal-msgs"></div>
	</form>
</div><!-- dashboard-slide-panel-wrap -->