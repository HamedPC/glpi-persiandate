<?php
/**
 * -------------------------------------------------------------------------
 * Persian Date plugin for GLPI
 * -------------------------------------------------------------------------
 *
 * Displays every date in GLPI using the Persian (Jalali) calendar, while
 * the database keeps storing the original Gregorian values untouched.
 * Disabling the plugin reverts all dates back to Gregorian instantly.
 *
 * Compatible with GLPI 10 and GLPI 11.
 *
 * @author    Hamed Zakeri
 * @link      https://github.com/hamedpc/glpi-persiandate
 * @license   GPL v2+ https://www.gnu.org/licenses/gpl-2.0.html
 * -------------------------------------------------------------------------
 */

define('PLUGIN_PERSIANDATE_VERSION', '1.0.1');

// Supported GLPI version range (GLPI 10 and 11).
define('PLUGIN_PERSIANDATE_MIN_GLPI', '10.0.0');
define('PLUGIN_PERSIANDATE_MAX_GLPI', '11.0.99');

/**
 * Plugin metadata shown on the GLPI "Plugins" page.
 *
 * @return array
 */
function plugin_version_persiandate()
{
    return [
        'name'         => 'Persian Date',
        'version'      => PLUGIN_PERSIANDATE_VERSION,
        'author'       => 'Hamed Zakeri',
        'license'      => 'GPL v2+',
        'homepage'     => 'https://github.com/hamedpc/glpi-persiandate',
        'requirements' => [
            'glpi' => [
                'min' => PLUGIN_PERSIANDATE_MIN_GLPI,
                'max' => PLUGIN_PERSIANDATE_MAX_GLPI,
            ],
        ],
    ];
}

/**
 * Prerequisites check. No server-side dependency is required: the plugin is
 * purely front-end (JavaScript/CSS), so it is always compatible.
 *
 * @return bool
 */
function plugin_persiandate_check_prerequisites()
{
    return true;
}

/**
 * Configuration check. Nothing to configure.
 *
 * @return bool
 */
function plugin_persiandate_check_config()
{
    return true;
}

/**
 * Install hook. The plugin creates no tables and changes nothing in the
 * database, so there is nothing to do here.
 *
 * @return bool
 */
function plugin_persiandate_install()
{
    return true;
}

/**
 * Uninstall hook. Nothing was created, so nothing has to be removed.
 *
 * @return bool
 */
function plugin_persiandate_uninstall()
{
    return true;
}

/**
 * Initialise the plugin: register the CSS/JS assets that turn every GLPI
 * date field and date label into the Persian (Jalali) calendar.
 *
 * The web-served assets live under the plugin's `public/` directory.
 * GLPI 11 exposes them at `/plugins/<key>/<path>` (the `public/` segment is
 * added internally), whereas GLPI 10 serves the files by their real path and
 * therefore needs the `public/` prefix in the declared URL. We pick the right
 * prefix based on the running GLPI version so a single package works on both.
 *
 * @return void
 */
function plugin_init_persiandate()
{
    global $PLUGIN_HOOKS;

    // Mark the plugin as CSRF compliant (required by GLPI to load its hooks).
    $PLUGIN_HOOKS['csrf_compliant']['persiandate'] = true;

    $prefix = version_compare(GLPI_VERSION, '11.0', '>=') ? '' : 'public/';

    // Front-end assets. Order matters:
    //   1) jquery-bridge      : guarantees a global window.jQuery for the libs
    //   2) persian-date       : Jalali date engine (leap years, conversions)
    //   3) persian-datepicker : the visual Jalali calendar widget
    //   4) persiandate        : our glue code that swaps GLPI pickers/labels
    $PLUGIN_HOOKS['add_javascript']['persiandate'] = [
        $prefix . 'js/jquery-bridge.js',
        $prefix . 'lib/persian-date.min.js',
        $prefix . 'lib/persian-datepicker.min.js',
        $prefix . 'js/persiandate.js',
    ];

    $PLUGIN_HOOKS['add_css']['persiandate'] = [
        $prefix . 'lib/persian-datepicker.min.css',
        $prefix . 'css/persiandate.css',
    ];
}
