<?php
/**
 * Plugin Name: Time TV Headless Revalidate
 * Description: Notifies the Next.js front end when content changes so published articles go live within seconds instead of waiting for the revalidation window.
 * Version:     1.0.0
 * Author:      Ethixweb
 *
 * INSTALL
 *   Upload to wp-content/mu-plugins/ (create the folder if needed). Files in
 *   mu-plugins load automatically and cannot be deactivated by accident.
 *
 * CONFIGURE — add to wp-config.php, above "That's all, stop editing":
 *   define('HEADLESS_FRONTEND_URL', 'https://timetv.news');
 *   define('HEADLESS_REVALIDATE_SECRET', 'the same value as REVALIDATE_SECRET');
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('timetv_headless_ping')) {
    /**
     * Fire-and-forget POST to the front end. Non-blocking so saving a post in
     * the admin never waits on the network.
     */
    function timetv_headless_ping(array $payload): void
    {
        if (!defined('HEADLESS_FRONTEND_URL') || !defined('HEADLESS_REVALIDATE_SECRET')) {
            return;
        }

        $payload['secret'] = HEADLESS_REVALIDATE_SECRET;

        wp_remote_post(
            rtrim(HEADLESS_FRONTEND_URL, '/') . '/api/revalidate/', // trailing slash matters: trailingSlash is on
            [
                'blocking' => false,
                'timeout'  => 2,
                'headers'  => ['Content-Type' => 'application/json'],
                'body'     => wp_json_encode($payload),
            ]
        );
    }
}

/**
 * Published, updated, or unpublished post.
 *
 * We send the slug plus every category archive the post belongs to, so the
 * article and the lists that contain it refresh together.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') {
        return;
    }
    if ($new_status !== 'publish' && $old_status !== 'publish') {
        return;
    }

    $paths = ['/', '/latest'];

    foreach (wp_get_post_categories($post->ID) as $cat_id) {
        $link = get_category_link($cat_id);
        $path = wp_parse_url($link, PHP_URL_PATH);
        if ($path) {
            $paths[] = $path;
        }
    }

    timetv_headless_ping([
        'slug'  => $post->post_name,
        'paths' => array_values(array_unique($paths)),
    ]);
}, 10, 3);

/** A deleted post must disappear from the front end too. */
add_action('after_delete_post', function ($post_id, $post) {
    if (!$post || $post->post_type !== 'post') {
        return;
    }
    timetv_headless_ping([
        'slug'  => $post->post_name,
        'paths' => ['/', '/latest'],
    ]);
}, 10, 2);

/** Renaming or adding a category changes the navigation on every page. */
add_action('edited_category', function () {
    timetv_headless_ping(['paths' => ['/', '/latest']]);
});
