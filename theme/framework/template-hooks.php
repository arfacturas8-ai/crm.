<?php
/**
 * Header
 * @see houzez_template_header()
 * 
 */
add_action( 'houzez_header', 'houzez_template_header', 10 );

/**
 * Footer
 * @see houzez_template_footer()
 * 
 */
add_action( 'houzez_footer', 'houzez_template_footer', 10 );

add_action( 'houzez_after_footer', 'houzez_backtotop_compare' );
add_action( 'houzez_after_footer', 'houzez_mobile_map_switch' );
add_action( 'houzez_after_footer', 'houzez_mobile_search' );
add_action( 'houzez_after_footer', 'houzez_login_password_reset' );
add_action( 'houzez_after_footer', 'houzez_listing_preview' );
add_action( 'houzez_after_footer', 'houzez_property_detail_files' );
add_action( 'houzez_after_footer', 'houzez_realtor_contact_form' );
add_action( 'houzez_after_footer', 'houzez_crm_files' );