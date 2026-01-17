<?php
if( ! function_exists( 'houzez_template_header' ) ) {

	function houzez_template_header() {
		get_template_part('template-parts/header/main');
	}
}

if( ! function_exists( 'houzez_template_footer' ) ) {

	function houzez_template_footer() {
		get_template_part('template-parts/footer/main'); 
	}
}

if( ! function_exists( 'houzez_crm_files' ) ) {

    function houzez_crm_files() {
        if(houzez_is_dashboard()) { 
            if( isset($_GET['hpage']) && $_GET['hpage'] == 'leads' ) {
                get_template_part('template-parts/dashboard/board/leads/new-lead-panel');

            } elseif( isset($_GET['hpage']) && $_GET['hpage'] == 'deals' ) {
                get_template_part('template-parts/dashboard/board/deals/new-deal-panel');

            } elseif( (isset($_GET['hpage']) && $_GET['hpage'] == 'enquiries') || (isset($_GET['hpage']) && ($_GET['hpage'] == 'lead-detail' && $_GET['tab']== 'enquires'))  ) {
                get_template_part('template-parts/dashboard/board/enquires/add-new-enquiry');
            }
        }
    }
}

if( ! function_exists( 'houzez_realtor_contact_form' ) ) {

    function houzez_realtor_contact_form() {

        if( ( is_singular('houzez_agency') && houzez_option('agency_form_agency_page', 1) ) || ( is_singular('houzez_agent') && houzez_option('agent_form_agent_page', 1) ) ) {
            get_template_part('template-parts/realtors/contact', 'form'); 
        }
    }
}

if( ! function_exists( 'houzez_property_detail_files' ) ) {

    function houzez_property_detail_files() {
        
        if(is_singular('property')) {
            get_template_part( 'property-details/mobile-property-contact');
            get_template_part( 'property-details/lightbox');
        }
    }
}

if( ! function_exists( 'houzez_listing_preview' ) ) {

    function houzez_listing_preview() {
        
        get_template_part('template-parts/listing/listing-lightbox'); 
    }
}

if( ! function_exists( 'houzez_login_password_reset' ) ) {

    function houzez_login_password_reset() {
        
        if( !houzez_is_login_page() ) { 
			get_template_part('template-parts/login-register/modal-login-register'); 
		}
		get_template_part('template-parts/login-register/modal-reset-password-form'); 
    }
}

if( ! function_exists( 'houzez_mobile_search' ) ) {

    function houzez_mobile_search() {
         
        $search_enable = houzez_option('main-search-enable');
        $adv_search = get_post_meta( houzez_postid(), 'fave_adv_search', true);
        if( wp_is_mobile() && ( $search_enable != 0 || $adv_search == 'show' || $adv_search == 'hide_show' ) ) {
			get_template_part('template-parts/search/mobile-search'); 
		}  
    }
}

if( ! function_exists( 'houzez_mobile_map_switch' ) ) {

    function houzez_mobile_map_switch() {
        
        if( houzez_is_half_map() ) {
			get_template_part('template-parts/listing/partials/mobile-map-switch');
		}
    }
}

if( ! function_exists( 'houzez_backtotop_compare' ) ) {

    function houzez_backtotop_compare() {
        
        if ( ! houzez_is_splash() && ! houzez_is_dashboard() ) {
        	if( houzez_option('backtotop') ) {
				get_template_part('template-parts/footer/back-to-top'); 
			}
	        get_template_part('template-parts/listing/compare-properties'); 
        }
    }
}


if( !function_exists('houzez_setup_loop') ) {
    /**
     * Sets up the houzez_loop global from the passed args.
     *
     * @since 1.1.0
     * @param array $args Args to pass into the global.
     */
    function houzez_setup_loop( $args = array() ) {
        

        $default_args = array();

        if( is_page_template('template/template-search.php') ) {
            $default_args['isSearch'] = 'Yes';
        }

        // Merge any existing values.
        if ( isset( $GLOBALS['houzez_loop'] ) ) {
            $default_args = array_merge( $default_args, $GLOBALS['houzez_loop'] );
        }

        $GLOBALS['houzez_loop'] = wp_parse_args( $args, $default_args );
    }
    add_action( 'wp', 'houzez_setup_loop', 50 );
    add_action( 'loop_start', 'houzez_setup_loop', 10 );
}

if ( ! function_exists( 'houzez_reset_loop' ) ) {
    /**
     * Resets the houzez_loop global.
     *
     * @since 1.0.0
     */
    function houzez_reset_loop() {
        unset( $GLOBALS['houzez_loop'] );
        houzez_setup_loop();
    }
    add_action( 'loop_end', 'houzez_reset_loop', 1000 );
}


if( !function_exists( 'houzez_get_loop_prop' ) ) {
    /**
     * Gets a property from the houzez_loop global.
     *
     * @since 1.0.0
     * @param string $prop Prop to get.
     * @param string $default Default if the prop does not exist.
     * @return mixed
     */
    function houzez_get_loop_prop( $prop, $default = '' ) {
        houzez_setup_loop(); // Ensure shop loop is setup.

        return isset( $GLOBALS['houzez_loop'], $GLOBALS['houzez_loop'][ $prop ] ) ? $GLOBALS['houzez_loop'][ $prop ] : $default;
    }
}

if( !function_exists( 'houzez_set_loop_prop' ) ) {
    /**
     * Sets a property in the houzez_loop global.
     *
     * @since 1.0.0
     * @param string $prop Prop to set.
     * @param string $value Value to set.
     */
    function houzez_set_loop_prop( $prop, $value = '' ) {
        if ( ! isset( $GLOBALS['houzez_loop'] ) ) {
            houzez_setup_loop();
        }
        $GLOBALS['houzez_loop'][ $prop ] = $value;
    }
}