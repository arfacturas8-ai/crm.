<?php
global $enquiry, $matched_query, $lead;
$lead_id = isset($_GET['lead-id']) ? intval($_GET['lead-id']) : 0;
$tab     = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'enquires';
$lead = Houzez_Leads::get_lead($lead_id);
$back_link = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
?>
<header class="header-main-wrap dashboard-header-main-wrap">
    <div class="dashboard-header-wrap">
        <div class="d-flex align-items-center">
            <div class="dashboard-header-left flex-grow-1">
                <h1><?php esc_html_e('Detalle del Contacto', 'houzez'); ?></h1>
            </div><!-- dashboard-header-left -->
            <div class="dashboard-header-right">
                <!-- Opcional: agregar otros botones -->
            </div><!-- dashboard-header-right -->
        </div><!-- d-flex -->
    </div><!-- dashboard-header-wrap -->
</header><!-- .header-main-wrap -->

<section class="dashboard-content-wrap">
    <div class="dashboard-content-inner-wrap">
        <div class="dashboard-content-block-wrap">
            <?php if ( $lead ) { ?>
                <div class="row">
                    <div class="col-md-4 col-sm-12">
                        <div class="dashboard-content-block">
                            <?php get_template_part('template-parts/dashboard/board/leads/lead-info'); ?>
                        </div><!-- dashboard-content-block -->       
                    </div><!-- col-md-4 col-sm-12 -->
                    <div class="col-md-8 col-sm-12">
                        <ul class="nav nav-pills lead-nav-tab" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link <?php if($tab === 'enquires') echo 'active'; ?>"
                                   data-toggle="pill"
                                   href="#enquires"
                                   role="tab"
                                >
                                    <?php esc_html_e('Búsquedas', 'houzez'); ?>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link <?php if($tab === 'notes') echo 'active'; ?>"
                                   data-toggle="pill"
                                   href="#notes"
                                   role="tab"
                                >
                                    <?php esc_html_e('Notas', 'houzez'); ?>
                                </a>
                            </li>
                            <li class="nav-item ml-auto">
                                <a class="nav-link text-primary" href="<?php echo esc_url($back_link); ?>">
                                    <?php esc_html_e('Volver', 'houzez'); ?>
                                </a>
                            </li>
                        </ul>
                        <div class="dashboard-content-block tab-content">
                            <div class="tab-pane fade <?php if($tab === 'enquires') echo 'show active'; ?>" id="enquires" role="tabpanel">
                                <p class="mb-0">
                                    <?php esc_html_e('Aquí irían las búsquedas relacionadas a este contacto.', 'houzez'); ?>
                                </p>
                            </div>
                            <div class="tab-pane fade <?php if($tab === 'notes') echo 'show active'; ?>" id="notes" role="tabpanel">
                                <p class="mb-0">
                                    <?php esc_html_e('Aquí irían las notas privadas para este contacto.', 'houzez'); ?>
                                </p>
                            </div>
                        </div><!-- dashboard-content-block tab-content -->
                    </div><!-- col-md-8 col-sm-12 -->
                </div><!-- .row -->
            <?php } else { ?>
                <div class="dashboard-content-block">
                    <?php esc_html_e("No tienes permiso para acceder a este contacto, o no existe.", 'houzez'); ?>
                </div>
            <?php } ?>
        </div><!-- dashboard-content-block-wrap -->
    </div><!-- dashboard-content-inner-wrap -->
</section><!-- dashboard-content-wrap -->
<section class="dashboard-side-wrap">
    <?php get_template_part('template-parts/dashboard/side-wrap'); ?>
</section>