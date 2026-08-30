<?php
/**
 * Plugin Name: SoloSpider SEO Sync Helper
 * Plugin URI: https://solospider.ai
 * Description: Enables secure, remote writing of Yoast SEO and Rank Math meta descriptions/titles/keywords via the WordPress REST API for SoloSpider.
 * Version: 1.1.0
 * Author: SoloSpider AI
 * License: GPL2
 */

if ( ! defined( "ABSPATH" ) ) {
    exit;
}

// Hook into REST API insert to save protected/internal Yoast/Rank Math meta keys directly
add_action("rest_api_init", "solospider_register_rest_hooks");
function solospider_register_rest_hooks() {
    $post_types = get_post_types(array("public" => true), "names");
    foreach ($post_types as $type) {
        add_action("rest_insert_{$type}", "solospider_save_meta_on_rest_insert", 10, 3);
        
        // Also register meta fields to show up in REST read requests
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
        register_post_meta($type, "_yoast_wpseo_focuskw", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
        register_post_meta($type, "_yoast_wpseo_content_score", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
        register_post_meta($type, "_yoast_wpseo_linkdex", array(
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
        register_post_meta($type, "rank_math_focus_keyword", array(
            "show_in_rest" => true,
            "single"       => true,
            "type"         => "string",
        ));
    }
}

function solospider_save_meta_on_rest_insert($post, $request, $creating) {
    $params = $request->get_json_params();
    if (empty($params) || !isset($params['meta'])) {
        return;
    }

    $meta = $params['meta'];
    $post_id = $post->ID;

    $keys_to_save = array(
        '_yoast_wpseo_focuskw',
        'yoast_wpseo_focuskw',
        '_yoast_wpseo_content_score',
        'yoast_wpseo_content_score',
        '_yoast_wpseo_linkdex',
        'yoast_wpseo_linkdex',
        '_yoast_wpseo_title',
        'yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        'yoast_wpseo_metadesc',
        'rank_math_description',
        'rank_math_title',
        'rank_math_focus_keyword'
    );

    foreach ($keys_to_save as $key) {
        if (isset($meta[$key])) {
            update_post_meta($post_id, $key, sanitize_text_field($meta[$key]));
        }
    }
}
