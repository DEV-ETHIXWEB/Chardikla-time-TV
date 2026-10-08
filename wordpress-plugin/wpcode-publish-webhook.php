/**
 * Headless publish webhook — for the WPCode plugin.
 *
 * WPCode → Code Snippets → + Add Snippet → "Add Your Custom Code"
 *   Code Type : PHP Snippet
 *   Location  : Run Everywhere
 *   Paste everything below, WITHOUT an opening <?php tag.
 *
 * Set the secret on the line marked below to the value of REVALIDATE_SECRET
 * in the Vercel project. The two must be identical or the request is rejected.
 *
 * Deliberately written with no top-level named functions. WPCode evaluates a
 * snippet inside a function scope, where a nested function declaration is not
 * hoisted and is re-declared on every request — a fatal error the second time.
 * Constants and a closure are safe there.
 */

if (!defined('HEADLESS_FRONTEND_URL')) {
    define('HEADLESS_FRONTEND_URL', 'https://chardikla-time-tv.vercel.app');
}
if (!defined('HEADLESS_REVALIDATE_SECRET')) {
    define('HEADLESS_REVALIDATE_SECRET', 'PASTE_THE_VERCEL_SECRET_HERE'); // <-- change this
}

/**
 * Tell the new front end when a post is published, updated or unpublished, so
 * it appears within seconds instead of waiting for the refresh window.
 *
 * transition_post_status rather than save_post: it also fires when a post is
 * moved to draft or trash, which is exactly when a stale page most needs to be
 * cleared. Non-blocking, so saving a post never waits on the network.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') {
        return;
    }
    // Something becoming public, or something public going away.
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
