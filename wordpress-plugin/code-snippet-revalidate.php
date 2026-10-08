<?php
/**
 * Paste this into WordPress → Code Snippets → Add New.
 * Title it "Headless publish webhook", set it to "Run everywhere", and Activate.
 *
 * No file upload needed — this is why Code Snippets being installed is handy.
 *
 * Change these two lines to match the live deployment before activating.
 */
define_safe_headless_constants();
function define_safe_headless_constants() {
    if (!defined('HEADLESS_FRONTEND_URL')) {
        define('HEADLESS_FRONTEND_URL', 'https://chardikla-time-tv.vercel.app');
    }
    if (!defined('HEADLESS_REVALIDATE_SECRET')) {
        // Must match REVALIDATE_SECRET in the Vercel environment variables.
        define('HEADLESS_REVALIDATE_SECRET', 'PASTE_THE_SAME_SECRET_HERE');
    }
}

/**
 * Tell the new front end when something is published, updated or unpublished,
 * so the article appears within seconds instead of waiting for the refresh
 * window. Non-blocking: saving a post never waits on the network.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') {
        return;
    }
    if ($new_status !== 'publish' && $old_status !== 'publish') {
        return;
    }

    $paths = array('/', '/latest');
    foreach (wp_get_post_categories($post->ID) as $cat_id) {
        $path = wp_parse_url(get_category_link($cat_id), PHP_URL_PATH);
        if ($path) {
            $paths[] = $path;
        }
    }

    wp_remote_post(
        rtrim(HEADLESS_FRONTEND_URL, '/') . '/api/revalidate/',
        array(
            'blocking' => false,
            'timeout'  => 2,
            'headers'  => array('Content-Type' => 'application/json'),
            'body'     => wp_json_encode(array(
                'secret' => HEADLESS_REVALIDATE_SECRET,
                'slug'   => $post->post_name,
                'paths'  => array_values(array_unique($paths)),
            )),
        )
    );
}, 10, 3);
