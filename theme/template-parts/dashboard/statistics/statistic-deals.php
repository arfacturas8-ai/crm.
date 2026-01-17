<?php
// Se sigue usando la lógica original para conteos
$active_count = Houzez_Deals::get_total_deals_by_group('active'); // Amarillo
$won_count    = Houzez_Deals::get_total_deals_by_group('won');    // Verde
$lost_count   = Houzez_Deals::get_total_deals_by_group('lost');   // Rojo
?>
<div class="dashboard-content-block dashboard-statistic-block">
    <h3>
        <i class="houzez-icon icon-sign-badge-circle mr-2 primary-text"></i> 
        <?php esc_html_e('Seguimientos', 'houzez'); ?>
    </h3>
    <div class="d-flex align-items-center sm-column">
        <div class="statistic-doughnut-chart">
            <!-- Mantenemos data-active, data-won, data-lost -->
            <canvas 
                id="deals-doughnut-chart"
                data-active="<?php echo intval($active_count); ?>"
                data-won="<?php echo intval($won_count); ?>"
                data-lost="<?php echo intval($lost_count); ?>"
                width="100"
                height="100">
            </canvas>
        </div>
        <div class="doughnut-chart-data flex-fill">
            <ul class="list-unstyled">
                <!-- 'active' → Amarillo: Dar seguimiento -->
                <li class="stats-data-3">
                    <i class="houzez-icon icon-sign-badge-circle mr-1"></i>
                    <strong><?php esc_html_e('Dar seguimiento', 'houzez'); ?></strong>
                    <span>
                        <?php echo number_format_i18n($active_count); ?>
                        <small><?php esc_html_e('Seguimientos', 'houzez'); ?></small>
                    </span>
                </li>
                <!-- 'won' → Verde: Cliente potencial -->
                <li class="stats-data-4">
                    <i class="houzez-icon icon-sign-badge-circle mr-1"></i>
                    <strong><?php esc_html_e('Cliente potencial', 'houzez'); ?></strong>
                    <span>
                        <?php echo number_format_i18n($won_count); ?>
                        <small><?php esc_html_e('Seguimientos', 'houzez'); ?></small>
                    </span>
                </li>
                <!-- 'lost' → Rojo: Descartado -->
                <li class="stats-data-1">
                    <i class="houzez-icon icon-sign-badge-circle mr-1"></i>
                    <strong><?php esc_html_e('Descartado', 'houzez'); ?></strong>
                    <span>
                        <?php echo number_format_i18n($lost_count); ?>
                        <small><?php esc_html_e('Seguimientos', 'houzez'); ?></small>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</div>