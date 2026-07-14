<?php
/**
 * Plugin Name: SoloSpider SEO Sync Helper
 * Plugin URI: https://solospider.ai
 * Description: Enables secure, remote writing of Yoast SEO and Rank Math meta descriptions/titles via the WordPress REST API for SoloSpider.
 * Version: 1.0.0
 * Author: SoloSpider AI
 * License: GPL2
 */

if ( ! defined( "ABSPATH" ) ) {
    exit;
}

add_action("init", "solospider_register_meta_for_rest");
function solospider_register_meta_for_rest() {
    $post_types = get_post_types(array("public" => true), "names");
    foreach ($post_types as $type) {
        register_post_meta($type, "_yoast_wpseo_metadesc", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
        register_post_meta($type, "_yoast_wpseo_title", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
        register_post_meta($type, "rank_math_description", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
        register_post_meta($type, "rank_math_title", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
    }
}
