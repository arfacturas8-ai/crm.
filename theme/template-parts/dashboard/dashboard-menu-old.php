<?php
global $houzez_local;

$userID = get_current_user_id();
$dash_profile_link = houzez_get_template_link_2('template/user_dashboard_profile.php');
$dashboard_insight = houzez_get_template_link_2('template/user_dashboard_insight.php');
$dashboard_properties = houzez_get_template_link_2('template/user_dashboard_properties.php');
$dashboard_add_listing = houzez_get_template_link_2('template/user_dashboard_submit.php');
$dashboard_favorites = houzez_get_template_link_2('template/user_dashboard_favorites.php');
$dashboard_search = houzez_get_template_link_2('template/user_dashboard_saved_search.php');
$dashboard_invoices = houzez_get_template_link_2('template/user_dashboard_invoices.php');
$dashboard_msgs = houzez_get_template_link_2('template/user_dashboard_messages.php');
$dashboard_membership = houzez_get_template_link_2('template/user_dashboard_membership.php');
$dashboard_gdpr = houzez_get_template_link_2('template/user_dashboard_gdpr.php');
$dashboard_seen_msgs = add_query_arg( 'view', 'inbox', $dashboard_msgs );
$dashboard_unseen_msgs = add_query_arg( 'view', 'sent', $dashboard_msgs );

$dashboard_crm = houzez_get_template_link_2('template/user_dashboard_crm.php');
$crm_leads = add_query_arg( 'hpage', 'leads', $dashboard_crm );
$crm_deals = add_query_arg( 'hpage', 'deals', $dashboard_crm );
$crm_enquiries = add_query_arg( 'hpage', 'enquiries', $dashboard_crm );
$crm_activities = add_query_arg( 'hpage', 'activities', $dashboard_crm );

$home_link = home_url('/');
$enable_paid_submission = houzez_option('enable_paid_submission');

$parent_crm = $parent_props = $parent_agents = $ac_crm = $ac_insight = $ac_profile = $ac_props = $ac_add_prop = $ac_fav = $ac_search = $ac_invoices = $ac_msgs = $ac_mem = $ac_gdpr = '';
if( is_page_template( 'template/user_dashboard_profile.php' ) ) {
    $ac_profile = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_properties.php' ) ) {
    $ac_props = 'class=active';
    $parent_props = "side-menu-parent-selected";
} elseif ( is_page_template( 'template/user_dashboard_submit.php' ) ) {
    $ac_add_prop = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_saved_search.php' ) ) {
    $ac_search = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_favorites.php' ) ) {
    $ac_fav = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_invoices.php' ) ) {
    $ac_invoices = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_messages.php' ) ) {
    $ac_msgs = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_membership.php' ) ) {
    $ac_mem = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_gdpr.php' ) ) {
    $ac_gdpr = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_insight.php' ) ) {
    $ac_insight = 'class=active';
} elseif ( is_page_template( 'template/user_dashboard_crm.php' ) ) {
    $ac_crm = 'class=active';
    $parent_crm = "side-menu-parent-selected";
}

$agency_agents = add_query_arg( 'agents', 'list', $dash_profile_link );
$agency_agent_add = add_query_arg( 'agents', 'add_new', $dash_profile_link );


$all = add_query_arg( 'prop_status', 'all', $dashboard_properties );
$mine_link = add_query_arg( 'prop_status', 'mine', $dashboard_properties );
$approved = add_query_arg( 'prop_status', 'approved', $dashboard_properties );
$pending = add_query_arg( 'prop_status', 'pending', $dashboard_properties );
$expired = add_query_arg( 'prop_status', 'expired', $dashboard_properties );
$draft = add_query_arg( 'prop_status', 'draft', $dashboard_properties );
$on_hold = add_query_arg( 'prop_status', 'on_hold', $dashboard_properties );
$disapproved = add_query_arg( 'prop_status', 'disapproved', $dashboard_properties );

$ac_approved = $ac_pending = $ac_expired = $ac_disapproved = $ac_all = $ac_mine  = $ac_draft = $ac_on_hold = $ac_agents = $ac_agent_new = '';

if( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'approved' ) {
    $ac_approved = $ac_props = 'class=active';

} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'pending' ) {
    $ac_pending = $ac_props = 'class=active';

} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'expired' ) {
    $ac_expired = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'disapproved' ) {
    $ac_disapproved = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'approved' ) {
    $ac_approved = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'draft' ) {
    $ac_draft = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'on_hold' ) {
    $ac_on_hold = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'all' ) {
    $ac_all = $ac_props = 'class=active';
} elseif( isset( $_GET['prop_status'] ) && $_GET['prop_status'] == 'mine' ) {
    $ac_mine = $ac_props = 'class=active';
}

if( isset( $_GET['agents'] ) && $_GET['agents'] == 'list' ) {
    $ac_agents = 'class=active';
    $parent_agents = "side-menu-parent-selected";
    $ac_profile = '';
} elseif( isset( $_GET['agents'] ) && $_GET['agents'] == 'add_new' ) {
    $ac_agents = 'class=active';
    $ac_agent_new = 'class=active';
    $ac_profile = '';
    $parent_agents = "side-menu-parent-selected";
}

$all_post_count = houzez_user_posts_count('any');
$publish_post_count = houzez_user_posts_count('publish');
$pending_post_count = houzez_user_posts_count('pending');
$draft_post_count = houzez_user_posts_count('draft');
$on_hold_post_count = houzez_user_posts_count('on_hold');
$disapproved_post_count = houzez_user_posts_count('disapproved');
$expired_post_count = houzez_user_posts_count('expired');
?>

<ul class="side-menu list-unstyled">
	<?php

	$side_menu = '';

	if ( !is_user_logged_in() ) {

		if( !empty( $dashboard_favorites ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_fav ).' href="'.esc_url($dashboard_favorites).'">
						<i class="houzez-icon icon-love-it mr-2"></i> '.houzez_option('dsh_favorite', 'Favorites').'
					</a>
				</li>';
	    }

	} else {

		if( houzez_option('dsh_home_btn', 0) == 1 ) {
			$side_menu .= '<li class="side-menu-item">
				<a href="'.esc_url( home_url( '/' ) ).'"><i class="houzez-icon icon-house mr-2"></i> '.houzez_option('dsh_home', 'Home').'</a>
			</li>';
		}

		if( !empty( $dashboard_crm ) && houzez_check_role() ) {
			$crm_menu = '';
			$crm_menu .= '<li class="side-menu-item '.esc_attr($parent_crm).'">';
					$crm_menu .= '<a '.$ac_crm.' href="'.esc_url($dashboard_crm).'">
						<i class="houzez-icon icon-layout-dashboard mr-2"></i> '.houzez_option('dsh_board', 'Board').'
					</a>';

					$crm_menu .= '<ul class="side-menu-dropdown list-unstyled">';
						
						$crm_menu .= '<li class="side-menu-item link-activities">
							<a href="'.esc_url($crm_activities).'"><i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_activities', 'Activities').'</a>
						</li>';
						$crm_menu .= '<li class="side-menu-item link-deals">
							<a href="'.esc_url($crm_deals).'"><i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_deals', 'Deals').'</a>
						</li>';
						$crm_menu .= '<li class="side-menu-item link-leads">
							<a href="'.esc_url($crm_leads).'"><i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_leads', 'Leads').'</a>
						</li>';

						$crm_menu .= '<li class="side-menu-item link-inquiries">
							<a href="'.esc_url($crm_enquiries).'"><i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_inquiries', 'Inquiries').'</a>
						</li>';

					$crm_menu .= '</ul>';
			$crm_menu .= '</li>';

			$side_menu .= $crm_menu;
		}

		if( !empty( $dashboard_insight ) && houzez_check_role() ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.$ac_insight.' href="'.esc_url($dashboard_insight).'">
						<i class="houzez-icon icon-analytics-bars mr-2"></i> '.houzez_option('dsh_insight', 'Insight').'
					</a>
				</li>';
		}

		if( !empty( $dashboard_properties ) && houzez_check_role() ) {
			$properties_menu = '';
			$properties_menu .= '<li class="side-menu-item '.esc_attr($parent_props).'">
					<a '.esc_attr( $ac_props ).' href="'.esc_url($dashboard_properties).'">
						<i class="houzez-icon icon-building-cloudy mr-2"></i> '.houzez_option('dsh_props', 'Properties').'
					</a>';
					$properties_menu .= '<ul class="side-menu-dropdown list-unstyled">';
						
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_all ).' href="'.esc_url($all).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_all', 'all').' ('.$all_post_count.')
							</a>
						</li>';

						if( houzez_can_manage() || houzez_is_editor() ) {
							$mine_post_count = houzez_user_posts_count('any', $mine = true);
							$properties_menu .= '<li class="side-menu-item">
									<a '.esc_attr( $ac_mine ).' href="'.esc_url($mine_link).'">
										<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_mine', 'Mine').' ('.$mine_post_count.')
									</a>
								</li>';
						}

						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_approved ).' href="'.esc_url($approved).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_published', 'published').' ('.$publish_post_count.')
							</a>
						</li>';
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_pending ).' href="'.esc_url($pending).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_pending', 'pending').' ('.$pending_post_count.')
							</a>
						</li>';
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_expired ).' href="'.esc_url($expired).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_expired', 'expired').' ('.$expired_post_count.')
							</a>
						</li>';
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_draft ).' href="'.esc_url($draft).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_draft', 'draft').' ('.$draft_post_count.')
							</a>
						</li>';
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_on_hold ).' href="'.esc_url($on_hold).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_hold', 'On hold').' ('.$on_hold_post_count.')
							</a>
						</li>';
						$properties_menu .= '<li class="side-menu-item">
							<a '.esc_attr( $ac_disapproved ).' href="'.esc_url($disapproved).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_disapproved', 'Disapproved').' ('.$disapproved_post_count.')
							</a>
						</li>';
					$properties_menu .= '</ul>';
				$properties_menu .= '</li>';

				$side_menu .= $properties_menu;
	    }

		if( !empty( $dashboard_add_listing ) && houzez_check_role() ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_add_prop ).' href="'.esc_url($dashboard_add_listing).'">
						<i class="houzez-icon icon-add-circle mr-2"></i> '.houzez_option('dsh_create_listing', 'Create a Listing').'
					</a>
				</li>';
	    }

		if( !empty( $dashboard_favorites ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_fav ).' href="'.esc_url($dashboard_favorites).'">
						<i class="houzez-icon icon-love-it mr-2"></i> '.houzez_option('dsh_favorite', 'Favorites').'
					</a>
				</li>';
	    }

		if( !empty( $dashboard_search ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_search ).' href="'.esc_url($dashboard_search).'">
						<i class="houzez-icon icon-search mr-2"></i> '.houzez_option('dsh_saved_searches', 'Saved Searches').'
					</a>
				</li>';
	    }


		if( !empty($dashboard_membership) && $enable_paid_submission == 'membership' && houzez_check_role() && ! houzez_is_admin() ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr($ac_mem).' href="'.esc_attr($dashboard_membership).'">
						<i class="houzez-icon icon-task-list-text-1 mr-2"></i> '.houzez_option('dsh_membership', 'Membership').'
					</a>
				</li>';
	    }

		if( !empty( $dashboard_invoices ) && houzez_check_role() ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr(  $ac_invoices ).' href="'.esc_url($dashboard_invoices).'">
						<i class="houzez-icon icon-accounting-document mr-2"></i> '.houzez_option('dsh_invoices', 'Invoices').'
					</a>
				</li>';
	    }

	    if( !empty( $dashboard_msgs ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr(  $ac_msgs ).' href="'.esc_url($dashboard_msgs).'">
						<i class="houzez-icon icon-messages-bubble mr-2"></i> '.houzez_option('dsh_messages', 'Messages').'
					</a>
				</li>';
	    }

	    if( !empty( $dash_profile_link ) && ( houzez_is_agency() ) ) {
			$side_menu .= '<li class="side-menu-item '.esc_attr($parent_agents).'">
					<a '.esc_attr( $ac_agents ).' href="'.esc_url($agency_agents).'">
						<i class="houzez-icon icon-single-neutral mr-2"></i> '.houzez_option('dsh_agents', 'Agents').'
					</a>
					<ul class="side-menu-dropdown list-unstyled">
						<li class="side-menu-item">
							<a '.esc_attr( $ac_agent_new ).' href="'.esc_url($agency_agent_add).'">
								<i class="houzez-icon icon-arrow-right-1"></i> '.houzez_option('dsh_addnew', 'Add New').'
							</a>
						</li>
					</ul>
				</li>';
	    }

		if( !empty( $dash_profile_link ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_profile ).' href="'.esc_url($dash_profile_link).'">
						<i class="houzez-icon icon-single-neutral-circle mr-2"></i> '.houzez_option('dsh_profile', 'My profile').'
					</a>
				</li>';	
		}

		if( !empty( $dashboard_gdpr ) ) {
			$side_menu .= '<li class="side-menu-item">
					<a '.esc_attr( $ac_gdpr ).' href="'.esc_url($dashboard_gdpr).'">
						<i class="houzez-icon icon-single-neutral-circle mr-2"></i> '.houzez_option('dsh_gdpr', 'GDPR Request').'
					</a>
				</li>';	
		}

	    $side_menu .= '<li class="side-menu-item">
				<a href="' . wp_logout_url( home_url() ) . '">
					<i class="houzez-icon icon-lock-5 mr-2"></i> '.houzez_option('dsh_logout', 'Log out').'
				</a>
			</li>';

	}

	echo $side_menu;
	?>
</ul>